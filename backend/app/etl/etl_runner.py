"""ETL orchestrator — runs the full ETL pipeline."""
from sqlalchemy.orm import Session
from datetime import date
import logging
import time

from .date_dimension import populate_date_dimension
from .dimensions import load_all_dimensions
from .facts import load_all_facts
from .daily_snapshot import load_daily_snapshot

logger = logging.getLogger("etl.runner")


def run_full_etl(db: Session) -> dict:
    """Execute all ETL steps in order and return a summary."""
    start = time.time()
    result: dict = {}

    logger.info("=== ETL START ===")

    # 1) Date dimension (idempotent — only inserts missing dates)
    logger.info("Step 1/4: Date dimension")
    result["date_dimension"] = populate_date_dimension(db)

    # 2) Dimensions (DELETE + INSERT)
    logger.info("Step 2/4: Dimensions")
    result["dimensions"] = load_all_dimensions(db)

    # 3) Facts (DELETE + INSERT)
    logger.info("Step 3/4: Facts")
    result["facts"] = load_all_facts(db)

    # 4) Daily snapshot (UPSERT today)
    logger.info("Step 4/4: Daily snapshot")
    result["snapshot_key"] = load_daily_snapshot(db, date.today())

    elapsed = round(time.time() - start, 2)
    result["elapsed_seconds"] = elapsed
    logger.info("=== ETL DONE in %.2fs ===", elapsed)
    return result
