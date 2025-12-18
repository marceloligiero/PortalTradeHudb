from sqlalchemy import create_engine, text
from app.config import settings

def main():
    print("Using DATABASE_URL from settings:")
    print(settings.DATABASE_URL)

    try:
        engine = create_engine(settings.DATABASE_URL, echo=False)
        with engine.connect() as conn:
            # For MySQL, SELECT DATABASE() shows current DB; for others, fall back to a simple test
            try:
                res = conn.execute(text("SELECT DATABASE()"))
                row = res.fetchone()
                current_db = row[0] if row is not None else None
                print(f"Connected. Current database reported by server: {current_db}")
            except Exception:
                # Fallback: a simple SELECT 1
                res = conn.execute(text("SELECT 1"))
                print("Connected. SELECT 1 returned:", res.scalar())
    except Exception as e:
        print("Connection failed:")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
