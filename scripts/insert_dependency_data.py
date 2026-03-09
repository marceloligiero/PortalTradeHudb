import pymysql

conn = pymysql.connect(host='localhost', user='root', password='', database='tradehub', charset='utf8mb4')
c = conn.cursor()

# Insert Departments
depts = ['CDE','CDI SAN','CHEQUES EXTERIORES','CONFIRMING','CONTROL','ESPANA',
         'FACTURACION','FINANCIACION','GARANTIAS','GENERAL','ONE-UK TRADE',
         'OPAGO','PAGOS','PROYECTOS','PRUEBAS','REM EXPORTACIONES','REM IMPORTACIONES']
for d in depts:
    try:
        c.execute('INSERT INTO departments (name) VALUES (%s)', (d,))
    except:
        pass
print(f'Inserted {len(depts)} departments')

# Insert Origins
origins = ['Terceros', 'Trade_Tecnología', 'Trade_Procesos']
for o in origins:
    try:
        c.execute('INSERT INTO error_origins (name) VALUES (%s)', (o,))
    except:
        pass
print(f'Inserted origins: {origins}')

# Insert bank BANCO SANTANDER
try:
    c.execute("INSERT INTO banks (code, name, country) VALUES ('BSAN', 'BANCO SANTANDER', 'ES')")
    print('Inserted BANCO SANTANDER')
except:
    print('BANCO SANTANDER already exists')

conn.commit()

# Get IDs
c.execute("SELECT id FROM banks WHERE code='BSAN'")
bsan_id = c.fetchone()[0]
print(f'BSAN bank_id = {bsan_id}')

c.execute("SELECT id FROM departments WHERE name='CDE'")
cde_id = c.fetchone()[0]
print(f'CDE dept_id = {cde_id}')

# Insert Activities for BSAN + CDE
activities = ['AGENDA CDE','APERTURA','CANC. ANTICIPOS','CONFIRMACION CDE',
              'CONFIRMACION MODIF. CDE','CONSULTA CDE','CONTROLES CDE','G/L CDE',
              'GESTION SWIFT','MODIFICACION','PDTE RECIBIR CREDITO CDE',
              'RECONFIRMACION CDE','REPORTES CDE']
for a in activities:
    try:
        c.execute('INSERT INTO activities (name, bank_id, department_id) VALUES (%s, %s, %s)', (a, bsan_id, cde_id))
    except Exception as e:
        print(f'  Skip activity {a}: {e}')
print(f'Inserted {len(activities)} CDE activities')

conn.commit()

# Get APERTURA activity id
c.execute('SELECT id FROM activities WHERE name=%s AND bank_id=%s AND department_id=%s', ('APERTURA', bsan_id, cde_id))
apertura_id = c.fetchone()[0]
print(f'APERTURA id = {apertura_id}')

# Insert Tipo Error codes for APERTURA
error_types = [
    '2 - Banco A', '31D - Date/Place', '32B - Currency/Amount', '39A - Tolerance',
    '40A - Form of Doc. Credit', '41 - Available With/Payment', '42P - Drafts Date',
    '43P - Partial Shipments / 43T - Transhipments',
    '44A - Origen / 44E - Port of Loading / 44F - Port',
    '44C - Latest Date of Shipment', '45A - Description of Goods/Incoterm',
    '46A - Documents', '47A - Additional Conditions', '48 - Period of Presentation',
    '49 - Confirmation Instructions', '50 - Ordering Customer'
]
for et in error_types:
    c.execute('INSERT INTO error_types (name, activity_id) VALUES (%s, %s)', (et, apertura_id))
print(f'Inserted {len(error_types)} error types for APERTURA')

conn.commit()

# Insert Categories (Tipología) with origin_id
c.execute("SELECT id FROM error_origins WHERE name='Terceros'")
terceros_id = c.fetchone()[0]

c.execute("SELECT id FROM error_origins WHERE name='Trade_Tecnología'")
tecno_id = c.fetchone()[0]

c.execute("SELECT id FROM error_origins WHERE name='Trade_Procesos'")
proce_id = c.fetchone()[0]

cats = [
    ('Proveedores', terceros_id),
    ('Oficina/Uni/Middle', terceros_id),
    ('Corresponsal', terceros_id),
    ('Gestión del cambio tecnológico inadecuado', tecno_id),
    ('Diseño inadecuado de los sistemas', tecno_id),
    ('Funcionamiento inadecuado de un sistema', tecno_id),
    ('Diseño ineficaz del proceso', proce_id),
    ('Desempeño ineficaz de un proceso', proce_id),
    ('Calidad de los datos', proce_id),
]
for name, oid in cats:
    c.execute('INSERT INTO tutoria_error_categories (name, origin_id) VALUES (%s, %s)', (name, oid))
print(f'Inserted {len(cats)} tipología categories with origin dependencies')

conn.commit()
conn.close()
print('All data inserted!')
