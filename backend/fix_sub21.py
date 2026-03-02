import pymysql

conn = pymysql.connect(
    host='72.60.188.172',
    user='tradehub_user',
    password='Ripma852369147',
    database='tradehub_db',
    autocommit=True
)
cursor = conn.cursor()
cursor.execute("UPDATE challenge_submissions SET completed_at = NOW(), status = 'COMPLETED' WHERE id = 21")
print("Submission 21: completed_at e status atualizados para COMPLETED")
conn.close()
