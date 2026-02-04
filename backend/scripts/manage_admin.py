import sqlite3
import bcrypt

def list_users(db_path='dev.db'):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    try:
        c.execute('SELECT id, email, role, is_active, is_pending FROM users')
        rows = c.fetchall()
        if not rows:
            print('NO_USERS')
        else:
            for r in rows:
                print(r)
    except Exception as e:
        print('ERR_LIST', e)
    finally:
        conn.close()


def create_admin(email='admin@tradehub.com', password='admin123'):
    db='dev.db'
    conn = sqlite3.connect(db)
    c = conn.cursor()
    try:
        # ensure users table exists
        c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            hashed_password TEXT NOT NULL,
            role TEXT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            is_pending BOOLEAN NOT NULL DEFAULT 0,
            created_at TEXT
        )
        """)
        # check
        c.execute('SELECT id FROM users WHERE email=?', (email,))
        if c.fetchone():
            print('ADMIN_EXISTS')
            return
        # Use bcrypt module to match application's hashing
        password_bytes = password.encode('utf-8')[:72]
        hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')
        c.execute('INSERT INTO users (email, full_name, hashed_password, role, is_active, is_pending) VALUES (?,?,?,?,?,?)',
                  (email, 'System Admin', hashed, 'ADMIN', 1, 0))
        conn.commit()
        print('ADMIN_CREATED')
    except Exception as e:
        print('ERR_CREATE', e)
    finally:
        conn.close()

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'create':
        email = sys.argv[2] if len(sys.argv) > 2 else 'admin@tradehub.com'
        pwd = sys.argv[3] if len(sys.argv) > 3 else 'admin123'
        create_admin(email, pwd)
    else:
        list_users()
