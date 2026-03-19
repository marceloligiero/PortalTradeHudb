"""Date dimension generator — populates dw_dim_date for a range of years."""
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import date, timedelta
import logging

logger = logging.getLogger("etl.date_dimension")

MONTH_NAMES = {
    1: "January", 2: "February", 3: "March", 4: "April",
    5: "May", 6: "June", 7: "July", 8: "August",
    9: "September", 10: "October", 11: "November", 12: "December",
}
MONTH_NAMES_SHORT = {
    1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr",
    5: "May", 6: "Jun", 7: "Jul", 8: "Aug",
    9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
}
DAY_NAMES = {0: "Monday", 1: "Tuesday", 2: "Wednesday", 3: "Thursday",
             4: "Friday", 5: "Saturday", 6: "Sunday"}


def populate_date_dimension(db: Session, start_year: int = 2020, end_year: int = 2030):
    """Insert all dates from start_year-01-01 to end_year-12-31 into dw_dim_date."""
    existing = db.execute(text("SELECT COUNT(*) FROM dw_dim_date")).scalar()
    if existing and existing > 0:
        logger.info("dw_dim_date already populated (%d rows), skipping.", existing)
        return existing

    current = date(start_year, 1, 1)
    end = date(end_year, 12, 31)
    rows = []

    while current <= end:
        rows.append({
            "date_key": int(current.strftime("%Y%m%d")),
            "full_date": current,
            "year": current.year,
            "quarter": (current.month - 1) // 3 + 1,
            "month": current.month,
            "month_name": MONTH_NAMES[current.month],
            "month_name_short": MONTH_NAMES_SHORT[current.month],
            "week": current.isocalendar()[1],
            "day_of_month": current.day,
            "day_of_week": current.weekday(),
            "day_name": DAY_NAMES[current.weekday()],
            "is_weekend": current.weekday() >= 5,
            "year_month": current.strftime("%Y-%m"),
        })
        current += timedelta(days=1)

    if rows:
        # Batch insert in chunks
        chunk_size = 500
        for i in range(0, len(rows), chunk_size):
            chunk = rows[i:i + chunk_size]
            db.execute(
                text("""INSERT IGNORE INTO dw_dim_date
                    (date_key, full_date, `year`, `quarter`, `month`, month_name, month_name_short,
                     `week`, day_of_month, day_of_week, day_name, is_weekend, `year_month`)
                    VALUES (:date_key, :full_date, :year, :quarter, :month, :month_name, :month_name_short,
                            :week, :day_of_month, :day_of_week, :day_name, :is_weekend, :year_month)"""),
                chunk,
            )
        db.commit()
        logger.info("Populated dw_dim_date with %d rows (%d–%d).", len(rows), start_year, end_year)
    return len(rows)
