import os
import sys
root = os.path.dirname(os.path.abspath(__file__))
if root not in sys.path:
    sys.path.insert(0, root)

from app.database import get_db
from app.models import User
import bcrypt

email = os.environ.get('RESET_EMAIL', 'teste@tradehub.com')
new_password = os.environ.get('RESET_PASSWORD', 'SenhaTeste123!')

print(f"Resetando senha para: {email}")

db = next(get_db())
try:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print("Usuário não encontrado:", email)
    else:
        pwd_bytes = new_password.encode('utf-8')[:72]
        hashed = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')
        user.hashed_password = hashed
        db.commit()
        print(f"Senha resetada com sucesso para {email}")
        print(f"Nova senha: {new_password}")
finally:
    db.close()
