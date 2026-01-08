import pymysql

conn = pymysql.connect(
    host='72.60.188.172',
    user='tradehub_user',
    password='Ripma852369147',
    database='tradehub_db',
    autocommit=True
)
cursor = conn.cursor()

# Corrigir submissions que têm completed_at mas status ainda é IN_PROGRESS
cursor.execute("""
    UPDATE challenge_submissions 
    SET status = 'REVIEWED' 
    WHERE completed_at IS NOT NULL 
    AND status = 'IN_PROGRESS'
""")
print(f"Corrigidas {cursor.rowcount} submissions para REVIEWED")

# Também corrigir a submission 21 que tem status COMPLETED para REVIEWED
cursor.execute("""
    UPDATE challenge_submissions 
    SET status = 'REVIEWED' 
    WHERE status = 'COMPLETED'
""")
print(f"Corrigidas {cursor.rowcount} submissions de COMPLETED para REVIEWED")

# Verificar resultado
cursor.execute("SELECT id, status, is_approved, completed_at FROM challenge_submissions WHERE user_id=3")
rows = cursor.fetchall()
for r in rows:
    print(r)

conn.close()
