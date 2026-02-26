"""Utilities for pagination

Pydantic v2 requires `GenericModel` and `model_config` for ORM/attribute
serialization. Use a lightweight GenericModel here so `response_model`
generics serialize correctly.
"""
from typing import TypeVar, Generic, List, Tuple
from pydantic import ConfigDict
from pydantic.generics import GenericModel
from sqlalchemy.orm import Query

T = TypeVar('T')


class PaginatedResponse(GenericModel, Generic[T]):
    """Generic paginated response model compatible with pydantic v2"""
    model_config = ConfigDict(from_attributes=True)

    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


def paginate(query: Query, page: int = 1, page_size: int = 10) -> Tuple[list, int]:
    """Paginate a SQLAlchemy query and return (items, total_count)."""
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 10
    if page_size > 100:
        page_size = 100

    total = query.count()
    # SQL Server requires an ORDER BY when using OFFSET/LIMIT. If the query
    # has no explicit ordering, try to order by the primary `id` attribute of
    # the first entity in the query to make OFFSET work deterministically.
    try:
        has_order = False
        # SQLAlchemy stores order by clauses in different attrs across versions
        if getattr(query, '_order_by_clauses', None):
            has_order = True
        if getattr(query, '_order_by', None):
            has_order = True
        if not has_order:
            desc = query.column_descriptions
            if desc and isinstance(desc, list) and desc[0].get('entity') is not None:
                entity = desc[0]['entity']
                if hasattr(entity, 'id'):
                    query = query.order_by(getattr(entity, 'id'))
    except Exception:
        # Best-effort: if we can't detect an ordering, continue and let the
        # underlying DB raise a descriptive error.
        pass

    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return items, total
