"""
Serviço de envio de emails usando Resend
"""
import requests
import logging
from app.config import settings

logger = logging.getLogger(__name__)

# API Key do Resend
RESEND_API_KEY = "re_Lb4qURgr_DWTaQvUjtfbqVqFDZzgSX4Cj"
RESEND_API_URL = "https://api.resend.com/emails"


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Envia um email usando a API do Resend
    
    Args:
        to_email: Endereço de destino
        subject: Assunto do email
        html_content: Conteúdo HTML do email
    
    Returns:
        True se enviado com sucesso, False caso contrário
    """
    try:
        headers = {
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Resend usa domínio onboarding para testes
        from_email = "TradeHub Formações <onboarding@resend.dev>"
        
        payload = {
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        
        response = requests.post(RESEND_API_URL, json=payload, headers=headers)
        
        if response.status_code == 200:
            logger.info(f"Email enviado com sucesso para {to_email} via Resend")
            return True
        else:
            logger.error(f"Erro Resend: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Erro ao enviar email para {to_email}: {str(e)}")
        return False


def send_password_reset_email(to_email: str, user_name: str, reset_token: str) -> bool:
    """
    Envia email de recuperação de senha
    
    Args:
        to_email: Email do usuário
        user_name: Nome do usuário
        reset_token: Token de recuperação
    
    Returns:
        True se enviado com sucesso
    """
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    
    subject = "Recuperação de Senha - TradeHub Formações"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .container {{
                background: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .header h1 {{
                color: #4F46E5;
                margin: 0;
            }}
            .content {{
                background: white;
                padding: 25px;
                border-radius: 8px;
                margin-bottom: 20px;
            }}
            .button {{
                display: inline-block;
                background: #4F46E5;
                color: white !important;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
            }}
            .button:hover {{
                background: #4338CA;
            }}
            .footer {{
                text-align: center;
                color: #666;
                font-size: 12px;
            }}
            .warning {{
                background: #FEF3C7;
                border-left: 4px solid #F59E0B;
                padding: 15px;
                margin: 15px 0;
                border-radius: 4px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎓 TradeHub Formações</h1>
            </div>
            
            <div class="content">
                <h2>Olá, {user_name}!</h2>
                
                <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
                
                <p>Clique no botão abaixo para criar uma nova senha:</p>
                
                <div style="text-align: center;">
                    <a href="{reset_url}" class="button">Redefinir Minha Senha</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul style="margin: 10px 0 0 0;">
                        <li>Este link expira em <strong>1 hora</strong></li>
                        <li>Se você não solicitou esta alteração, ignore este email</li>
                        <li>Sua senha atual permanecerá inalterada</li>
                    </ul>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    Se o botão não funcionar, copie e cole o link abaixo no seu navegador:<br>
                    <a href="{reset_url}" style="word-break: break-all;">{reset_url}</a>
                </p>
            </div>
            
            <div class="footer">
                <p>Este é um email automático, por favor não responda.</p>
                <p>&copy; 2024 TradeHub Formações. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return send_email(to_email, subject, html_content)
