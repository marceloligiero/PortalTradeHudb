import pymysql

conn = pymysql.connect(
    host='72.60.188.172',
    user='tradehub_user',
    password='Ripma852369147',
    database='tradehub_db'
)
cursor = conn.cursor(pymysql.cursors.DictCursor)

# Encontrar o desafio yesyedhahsdaj
cursor.execute("SELECT id, title FROM challenges WHERE title LIKE '%yesyed%'")
challenges = cursor.fetchall()
print("=== DESAFIO ===")
for ch in challenges:
    print(ch)
    challenge_id = ch['id']

# Verificar submissions deste challenge para user_id=3
cursor.execute("""
    SELECT id, user_id, challenge_id, status, is_approved, completed_at 
    FROM challenge_submissions 
    WHERE challenge_id = %s AND user_id = 3
""", (challenge_id,))
submissions = cursor.fetchall()
print("\n=== SUBMISSIONS ===")
for s in submissions:
    print(s)

conn.close()
