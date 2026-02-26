import pymysql

c = pymysql.connect(
    host='72.60.188.172',
    user='tradehub_user',
    password='Ripma852369147',
    database='tradehub_db',
    autocommit=True
)
cur = c.cursor()
cur.execute("UPDATE challenge_submissions SET status='PENDING_REVIEW', is_approved=NULL, calculated_mpu=NULL, mpu_vs_target=NULL, errors_count=0 WHERE id=21")
print('Submission 21 resetada para PENDING_REVIEW')
c.close()
