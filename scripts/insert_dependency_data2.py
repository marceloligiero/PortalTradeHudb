import pymysql

conn = pymysql.connect(host='localhost', user='root', password='', database='tradehub', charset='utf8mb4', autocommit=True)
c = conn.cursor()

# Get IDs
c.execute("SELECT id FROM banks WHERE code='BSAN'")
bsan_id = c.fetchone()[0]
c.execute("SELECT id FROM departments WHERE name='CDE'")
cde_id = c.fetchone()[0]
print(f'BSAN={bsan_id}, CDE={cde_id}')

# Insert Activities for BSAN + CDE
acts = ['AGENDA CDE','APERTURA','CANC. ANTICIPOS','CONFIRMACION CDE',
        'CONFIRMACION MODIF. CDE','CONSULTA CDE','CONTROLES CDE','G/L CDE',
        'GESTION SWIFT','MODIFICACION','PDTE RECIBIR CREDITO CDE',
        'RECONFIRMACION CDE','REPORTES CDE']
for a in acts:
    try:
        c.execute('INSERT INTO activities (name, bank_id, department_id, is_active) VALUES (%s,%s,%s,1)', (a, bsan_id, cde_id))
    except Exception as e:
        print(f'  SKIP {a}: {e}')
print(f'Inserted {len(acts)} activities')

# Get APERTURA id
c.execute('SELECT id FROM activities WHERE name=%s AND bank_id=%s', ('APERTURA', bsan_id))
apertura_id = c.fetchone()[0]
print(f'APERTURA id={apertura_id}')

# Insert error types for APERTURA
ets = [
    '2 - Banco A','31D - Date/Place','32B - Currency/Amount','39A - Tolerance',
    '40A - Form of Doc. Credit','41 - Available With/Payment','42P - Drafts Date',
    '43P - Partial Shipments / 43T - Transhipments',
    '44A - Origen / 44E - Port of Loading / 44F - Port',
    '44C - Latest Date of Shipment','45A - Description of Goods/Incoterm',
    '46A - Documents','47A - Additional Conditions','48 - Period of Presentation',
    '49 - Confirmation Instructions','50 - Ordering Customer'
]
for et in ets:
    c.execute('INSERT INTO error_types (name, activity_id, is_active) VALUES (%s,%s,1)', (et, apertura_id))
print(f'Inserted {len(ets)} error types')

# Insert categories with origin_id
c.execute("SELECT id FROM error_origins WHERE name='Terceros'")
terc = c.fetchone()[0]
c.execute("SELECT id FROM error_origins WHERE name='Trade_Tecnologia'")
tecno = c.fetchone()[0]
c.execute("SELECT id FROM error_origins WHERE name='Trade_Procesos'")
proce = c.fetchone()[0]
print(f'Terceros={terc}, Tecno={tecno}, Proce={proce}')

cats = [
    ('Proveedores', terc),
    ('Oficina/Uni/Middle', terc),
    ('Corresponsal', terc),
    ('Gestion del cambio tecnologico inadecuado', tecno),
    ('Diseno inadecuado de los sistemas', tecno),
    ('Funcionamiento inadecuado de un sistema', tecno),
    ('Diseno ineficaz del proceso', proce),
    ('Desempeno ineficaz de un proceso', proce),
    ('Calidad de los datos', proce),
]
for name, oid in cats:
    c.execute('INSERT INTO tutoria_error_categories (name, origin_id, is_active) VALUES (%s,%s,1)', (name, oid))
print(f'Inserted {len(cats)} categories with origin deps')

# Verify
print('\n=== Activities with dependencies ===')
c.execute('SELECT a.id, a.name, b.name, d.name FROM activities a LEFT JOIN banks b ON a.bank_id=b.id LEFT JOIN departments d ON a.department_id=d.id WHERE a.bank_id IS NOT NULL')
for r in c.fetchall():
    print(f'  [{r[0]}] {r[1]} -> Bank={r[2]}, Dept={r[3]}')

print('\n=== Error Types ===')
c.execute('SELECT et.id, et.name, a.name FROM error_types et LEFT JOIN activities a ON et.activity_id=a.id')
for r in c.fetchall():
    print(f'  [{r[0]}] {r[1]} -> Activity={r[2]}')

print('\n=== Categories with Origin ===')
c.execute('SELECT tc.id, tc.name, eo.name FROM tutoria_error_categories tc LEFT JOIN error_origins eo ON tc.origin_id=eo.id WHERE tc.origin_id IS NOT NULL')
for r in c.fetchall():
    print(f'  [{r[0]}] {r[1]} -> Origin={r[2]}')

conn.close()
print('\nAll done!')
