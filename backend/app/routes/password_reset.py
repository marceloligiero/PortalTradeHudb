"""
Rotas para recuperação de senha
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import secrets
import logging

from app.database import get_db
from app.models import User, PasswordResetToken
from app.auth import get_password_hash

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

# Token válido por 1 hora
TOKEN_EXPIRY_HOURS = 1


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyEmailRequest(BaseModel):
    email: EmailStr


class DirectResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class MessageResponse(BaseModel):
    message: str


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    Verifica se um email existe no sistema.
    Usado no fluxo de redefinição direta de senha.
    """
    user = db.query(User).filter(User.email == request.email.lower()).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email não encontrado no sistema"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário inativo. Entre em contato com o administrador."
        )
    
    logger.info(f"Email verificado para redefinição: {request.email}")
    return MessageResponse(message="Email encontrado")


@router.post("/direct-reset-password", response_model=MessageResponse)
def direct_reset_password(request: DirectResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Redefine a senha diretamente pelo email (sem token).
    Fluxo simplificado para quando o email é verificado primeiro.
    """
    # Valida a nova senha
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve ter pelo menos 6 caracteres"
        )
    
    # Busca o usuário
    user = db.query(User).filter(User.email == request.email.lower()).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário inativo"
        )
    
    # Atualiza a senha
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    
    logger.info(f"Senha redefinida diretamente para usuário {user.email}")
    
    return MessageResponse(message="Senha redefinida com sucesso!")


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Solicita recuperação de senha.
    Envia um email com link para redefinir a senha.
    
    Sempre retorna sucesso para não revelar se o email existe.
    """
    # Busca o usuário pelo email
    user = db.query(User).filter(User.email == request.email.lower()).first()
    
    if user and user.is_active:
        # Invalida tokens anteriores não utilizados
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False
        ).update({"used": True})
        
        # Gera novo token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY_HOURS)
        
        # Salva o token
        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at,
            used=False
        )
        db.add(reset_token)
        db.commit()
        
        # Envia o email
        email_sent = send_password_reset_email(
            to_email=user.email,
            user_name=user.full_name,
            reset_token=token
        )
        
        if email_sent:
            logger.info(f"Email de recuperação enviado para {user.email}")
        else:
            logger.warning(f"Falha ao enviar email de recuperação para {user.email}")
    else:
        logger.info(f"Tentativa de recuperação para email inexistente/inativo: {request.email}")
    
    # Sempre retorna sucesso para segurança
    return MessageResponse(
        message="Se o email estiver cadastrado, você receberá um link para redefinir sua senha."
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Redefine a senha usando o token de recuperação.
    """
    # Valida a nova senha
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha deve ter pelo menos 6 caracteres"
        )
    
    # Busca o token
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == request.token,
        PasswordResetToken.used == False
    ).first()
    
    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou já utilizado"
        )
    
    # Verifica expiração
    if datetime.utcnow() > reset_token.expires_at:
        reset_token.used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token expirado. Solicite uma nova recuperação de senha."
        )
    
    # Busca o usuário
    user = db.query(User).filter(User.id == reset_token.user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário não encontrado ou inativo"
        )
    
    # Atualiza a senha
    user.hashed_password = get_password_hash(request.new_password)
    
    # Marca o token como usado
    reset_token.used = True
    
    db.commit()
    
    logger.info(f"Senha redefinida com sucesso para usuário {user.email}")
    
    return MessageResponse(message="Senha redefinida com sucesso! Você já pode fazer login.")


@router.get("/validate-reset-token/{token}", response_model=MessageResponse)
def validate_reset_token(token: str, db: Session = Depends(get_db)):
    """
    Valida se um token de recuperação é válido.
    Usado para verificar antes de mostrar o formulário de nova senha.
    """
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token,
        PasswordResetToken.used == False
    ).first()
    
    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou já utilizado"
        )
    
    if datetime.utcnow() > reset_token.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token expirado"
        )
    
    return MessageResponse(message="Token válido")
