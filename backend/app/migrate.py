"""
Auto-migration system for TradeHub.

On every backend startup, checks the `_migrations` table for which SQL
scripts have already been applied and runs any new ones in order.

Migration files live in  <project_root>/database/migrations/  and must
follow the naming convention:

    V001__initial_schema.sql
    V002__add_chamados.sql
    ...

The version prefix (V001, V002, …) determines execution order.
Files are executed once and recorded in the `_migrations` table so that
re-running is always safe.
"""

from __future__ import annotations

import logging
import os
import re
from pathlib import Path

from sqlalchemy import text
from app.database import engine

logger = logging.getLogger("app.migrate")

# Folder that holds versioned SQL migration scripts
_MIGRATIONS_DIR = Path(__file__).resolve().parents[2] / "database" / "migrations"


def _ensure_migrations_table(conn) -> None:
    """Create the tracking table if it doesn't exist yet."""
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS _migrations (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            filename    VARCHAR(255) NOT NULL UNIQUE,
            applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            checksum    VARCHAR(64)  NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """))
    conn.commit()


def _applied_set(conn) -> set[str]:
    """Return the set of migration filenames already applied."""
    rows = conn.execute(text("SELECT filename FROM _migrations")).fetchall()
    return {r[0] for r in rows}


def _discover_files() -> list[tuple[str, Path]]:
    """Return sorted list of (filename, full_path) for migration SQL files."""
    if not _MIGRATIONS_DIR.is_dir():
        logger.warning("Migration directory does not exist: %s", _MIGRATIONS_DIR)
        return []

    pattern = re.compile(r"^V\d+__.*\.sql$", re.IGNORECASE)
    files: list[tuple[str, Path]] = []
    for entry in sorted(_MIGRATIONS_DIR.iterdir()):
        if entry.is_file() and pattern.match(entry.name):
            files.append((entry.name, entry))
    return files


def _execute_sql_file(conn, filepath: Path) -> None:
    """Execute a SQL file that may contain DELIMITER blocks.

    Handles MySQL DELIMITER directives so stored-procedure definitions
    inside migration scripts work correctly.
    """
    raw = filepath.read_text(encoding="utf-8")

    # Split on DELIMITER directives
    # Pattern: DELIMITER <new_delim>  ... statements ... DELIMITER ;
    parts = re.split(r"(?mi)^\s*DELIMITER\s+(.+)$", raw)

    # parts structure after split:
    #   [block_with_default_delim, new_delim, block, new_delim, block, ...]
    # Index 0 uses default ';', then pairs of (delimiter, block) follow.

    delimiter = ";"
    blocks: list[tuple[str, str]] = []  # (sql_block, delimiter)

    i = 0
    while i < len(parts):
        if i == 0:
            blocks.append((parts[0], ";"))
            i += 1
        else:
            # parts[i] = new delimiter, parts[i+1] = SQL block using that delimiter
            delimiter = parts[i].strip()
            if i + 1 < len(parts):
                blocks.append((parts[i + 1], delimiter))
            i += 2

    for block, delim in blocks:
        statements = block.split(delim)
        for stmt in statements:
            stmt = stmt.strip()
            if not stmt or stmt == ";":
                continue
            # Skip pure comments
            lines = [l for l in stmt.splitlines() if l.strip() and not l.strip().startswith("--")]
            if not lines:
                continue
            try:
                conn.execute(text(stmt))
            except Exception as e:
                # Log but continue — idempotent scripts may hit
                # "already exists" errors which are expected.
                err_msg = str(e).lower()
                ignorable = (
                    "already exists",
                    "duplicate column",
                    "duplicate key",
                    "duplicate entry",
                    "can't drop",
                    "check that column/key exists",
                )
                if any(kw in err_msg for kw in ignorable):
                    logger.debug("Ignorable: %s", e)
                else:
                    raise

    conn.commit()


def run_migrations() -> int:
    """Run all pending migrations. Returns count of applied migrations."""
    applied_count = 0

    with engine.connect() as conn:
        _ensure_migrations_table(conn)
        already_applied = _applied_set(conn)
        pending = _discover_files()

        if not pending:
            logger.info("No migration files found in %s", _MIGRATIONS_DIR)
            return 0

        new_files = [(name, path) for name, path in pending if name not in already_applied]

        if not new_files:
            logger.info("All %d migrations already applied.", len(pending))
            return 0

        logger.info("%d pending migration(s) to apply.", len(new_files))

        for filename, filepath in new_files:
            logger.info("Applying migration: %s", filename)
            try:
                _execute_sql_file(conn, filepath)
                # Record it
                import hashlib
                checksum = hashlib.sha256(filepath.read_bytes()).hexdigest()[:16]
                conn.execute(
                    text("INSERT INTO _migrations (filename, checksum) VALUES (:f, :c)"),
                    {"f": filename, "c": checksum},
                )
                conn.commit()
                applied_count += 1
                logger.info("  ✓ %s applied successfully.", filename)
            except Exception:
                logger.exception("  ✗ Failed to apply %s — aborting migrations.", filename)
                raise

    return applied_count
