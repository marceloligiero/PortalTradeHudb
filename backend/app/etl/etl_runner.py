"""ETL orchestrator — runs the full ETL pipeline."""
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import date
import logging
import time

from .date_dimension import populate_date_dimension
from .dimensions import load_all_dimensions
from .facts import load_all_facts
from .daily_snapshot import load_daily_snapshot

logger = logging.getLogger("etl.runner")

FACT_TABLES = [
    "dw_fact_daily_snapshot",
    "dw_fact_internal_errors",
    "dw_fact_chamados",
    "dw_fact_tutoria",
    "dw_fact_training",
]


def _clear_facts(db: Session):
    """Delete all rows from fact tables to release FK references on dimensions."""
    for table in FACT_TABLES:
        db.execute(text(f"DELETE FROM {table}"))
    db.commit()
    logger.info("Cleared %d fact tables", len(FACT_TABLES))


def run_full_etl(db: Session) -> dict:
    """Execute all ETL steps in order and return a summary."""
    start = time.time()
    result: dict = {"errors": []}

    logger.info("=== ETL START ===")

    # 1) Date dimension (idempotent — only inserts missing dates)
    logger.info("Step 1/5: Date dimension")
    try:
        result["date_dimension"] = populate_date_dimension(db)
    except Exception as e:
        logger.error("Step 1 (date_dimension) failed: %s", e, exc_info=True)
        result["date_dimension"] = None
        result["errors"].append(f"date_dimension: {e}")

    # 2) Clear all fact tables (release FK references)
    logger.info("Step 2/5: Clear fact tables")
    try:
        _clear_facts(db)
    except Exception as e:
        logger.error("Step 2 (clear_facts) failed: %s", e, exc_info=True)
        result["errors"].append(f"clear_facts: {e}")

    # 3) Dimensions (DELETE + INSERT) — safe now that facts are cleared
    logger.info("Step 3/5: Dimensions")
    try:
        result["dimensions"] = load_all_dimensions(db)
    except Exception as e:
        logger.error("Step 3 (dimensions) failed: %s", e, exc_info=True)
        result["dimensions"] = None
        result["errors"].append(f"dimensions: {e}")

    # 4) Facts (INSERT using fresh dimension keys)
    logger.info("Step 4/5: Facts")
    try:
        result["facts"] = load_all_facts(db)
    except Exception as e:
        logger.error("Step 4 (facts) failed: %s", e, exc_info=True)
        result["facts"] = None
        result["errors"].append(f"facts: {e}")

    # 5) Daily snapshot (UPSERT today)
    logger.info("Step 5/5: Daily snapshot")
    try:
        result["snapshot_key"] = load_daily_snapshot(db, date.today())
    except Exception as e:
        logger.error("Step 5 (daily_snapshot) failed: %s", e, exc_info=True)
        result["snapshot_key"] = None
        result["errors"].append(f"daily_snapshot: {e}")

    elapsed = round(time.time() - start, 2)
    result["elapsed_seconds"] = elapsed
    if result["errors"]:
        logger.warning("=== ETL DONE with %d error(s) in %.2fs ===", len(result["errors"]), elapsed)
    else:
        logger.info("=== ETL DONE in %.2fs ===", elapsed)
    return result
