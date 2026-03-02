from sqlalchemy import text, inspect
from app.database import engine

def main():
    insp = inspect(engine)
    tables = insp.get_table_names()
    if not tables:
        print('No tables found')
        return

    print('Found tables:', tables)
    with engine.begin() as conn:
        print('Disabling foreign key checks...')
        conn.execute(text('SET FOREIGN_KEY_CHECKS=0'))
        for t in tables:
            print('Dropping', t)
            conn.execute(text(f'DROP TABLE IF EXISTS `{t}`'))
        print('Re-enabling foreign key checks...')
        conn.execute(text('SET FOREIGN_KEY_CHECKS=1'))

    print('All tables dropped')

if __name__ == "__main__":
    main()
