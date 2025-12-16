import bcrypt

print('Testing bcrypt...')

# Test with a fresh hash
password = 'admin123'
salt = bcrypt.gensalt()
fresh_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
print(f'Fresh hash: {fresh_hash}')

result = bcrypt.checkpw(password.encode('utf-8'), fresh_hash)
print(f'Fresh hash check: {result}')

# Test with the stored hash
stored_hash = b'$2b$12$oH/Bn5hL7h03NftFs90JKeYOsKds7FPKqKmxqJiCnm70sSidoRv9a'
print(f'Stored hash: {stored_hash}')

try:
    result2 = bcrypt.checkpw(password.encode('utf-8'), stored_hash)
    print(f'Stored hash check: {result2}')
except Exception as e:
    print(f'Error with stored hash: {e}')
    import traceback
    traceback.print_exc()