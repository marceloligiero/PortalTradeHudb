import sys
from app.database import engine, Base
import app.models

print('Engine URL:', engine.url)

print('Dropping all tables if present...')
Base.metadata.drop_all(bind=engine)

print('Creating all tables...')
Base.metadata.create_all(bind=engine)

print('Done')
