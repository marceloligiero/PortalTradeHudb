import bcrypt

hash_from_db = '$2b$12$Q3.7hdhD.z3sgooAdDAQie0aHs8kIOQXkg5x7V1tgl8jTEVCbhSLW'
password = 'admin123'

result = bcrypt.checkpw(password.encode('utf-8'), hash_from_db.encode('utf-8'))
print('Password verification result:', result)