from sqlalchemy import text
from app.database import engine, Base
# Ensure models are imported so they are registered on Base.metadata
import app.models

def main():
    print("Engine URL:", engine.url)
    with engine.begin() as conn:
        print('Disabling foreign key checks...')
        conn.execute(text('SET FOREIGN_KEY_CHECKS=0'))

    print('Dropping all tables...')
    Base.metadata.drop_all(bind=engine)

    print('Creating all tables...')
    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        print('Re-enabling foreign key checks...')
        conn.execute(text('SET FOREIGN_KEY_CHECKS=1'))

    print('Done')

if __name__ == '__main__':
    main()
