import pymysql
conn = pymysql.connect(host='localhost', user='tradehub', password='tradehub123', database='tradehub_db')
cur = conn.cursor()
try:
    cur.execute('ALTER TABLE courses ADD COLUMN level VARCHAR(20) DEFAULT NULL')
    print('Column added')
except Exception as e:
    print(f'Column may already exist: {e}')
cur.execute("UPDATE courses SET level = 'BEGINNER' WHERE level IS NULL")
conn.commit()
print('Migration done')
conn.close()
