from sqlalchemy import inspect
from app.database import engine

def main():
    insp = inspect(engine)
    print('Tables:', insp.get_table_names())
    if 'users' in insp.get_table_names():
        print('Users columns:')
        for c in insp.get_columns('users'):
            print(' -', c['name'], str(c.get('type')))
    else:
        print('No users table found')

if __name__ == '__main__':
    main()
