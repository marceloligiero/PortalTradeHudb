import pyodbc
import os

# Database connection
import os

# Use environment variables when available; fallback to local SQL Server name
server = os.environ.get('DB_SERVER', r'PT-L163820\SQLEXPRESS')
database = os.environ.get('DB_NAME', 'etldata4you')
conn_str = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};Trusted_Connection=yes;'

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()

    # Update admin password hash
    new_hash = '$2b$12$Q3.7hdhD.z3sgooAdDAQie0aHs8kIOQXkg5x7V1tgl8jTEVCbhSLW'
    cursor.execute("UPDATE users SET hashed_password = ? WHERE email = ?", (new_hash, 'admin@tradehub.com'))

    conn.commit()
    print("Password hash updated successfully!")

    # Verify the update
    cursor.execute("SELECT email, hashed_password FROM users WHERE email = ?", ('admin@tradehub.com',))
    row = cursor.fetchone()
    if row:
        print(f"User: {row.email}, Hash: {row.hashed_password}")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")