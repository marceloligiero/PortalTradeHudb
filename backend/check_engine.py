from app import database
print('ENGINE URL:', getattr(database.engine, 'url', None))
try:
    with database.engine.connect() as conn:
        r = conn.execute('SELECT 1')
        print('SELECT 1 OK:', r.fetchall())
except Exception as e:
    import traceback
    print('ENGINE CONNECT ERROR:')
    traceback.print_exc()
