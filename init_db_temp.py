from backend.app.database import engine
from backend.app.models import Base
import sys
sys.path.insert(0, '/var/www/tradehub/backend')

Base.metadata.create_all(bind=engine)
print('OK')
