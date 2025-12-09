"""
Neon PostgreSQL Database Client
Replaces Supabase with direct PostgreSQL connection
"""

import os
from functools import lru_cache
from typing import Any, Optional

import structlog
import psycopg
from psycopg.rows import dict_row

from ..config import settings

logger = structlog.get_logger()


class DatabaseClient:
    """PostgreSQL database client for Neon."""

    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self._conn: Optional[psycopg.Connection] = None

    def _get_connection(self) -> psycopg.Connection:
        """Get or create a database connection."""
        if self._conn is None or self._conn.closed:
            self._conn = psycopg.connect(
                self.connection_string,
                row_factory=dict_row,
            )
        return self._conn

    async def execute(
        self, query: str, params: Optional[tuple] = None
    ) -> list[dict[str, Any]]:
        """Execute a query and return results."""
        conn = self._get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(query, params)
                if cur.description:
                    return cur.fetchall()
                conn.commit()
                return []
        except Exception as e:
            conn.rollback()
            logger.error("Database query failed", error=str(e), query=query[:100])
            raise

    async def execute_one(
        self, query: str, params: Optional[tuple] = None
    ) -> Optional[dict[str, Any]]:
        """Execute a query and return first result."""
        results = await self.execute(query, params)
        return results[0] if results else None

    async def insert(
        self, table: str, data: dict[str, Any], returning: str = "*"
    ) -> Optional[dict[str, Any]]:
        """Insert a row and return it."""
        columns = ", ".join(data.keys())
        placeholders = ", ".join(["%s"] * len(data))
        query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders}) RETURNING {returning}"
        return await self.execute_one(query, tuple(data.values()))

    async def update(
        self,
        table: str,
        data: dict[str, Any],
        where: str,
        where_params: tuple,
        returning: str = "*",
    ) -> Optional[dict[str, Any]]:
        """Update rows and return first result."""
        set_clause = ", ".join([f"{k} = %s" for k in data.keys()])
        query = f"UPDATE {table} SET {set_clause} WHERE {where} RETURNING {returning}"
        params = tuple(data.values()) + where_params
        return await self.execute_one(query, params)

    async def select(
        self,
        table: str,
        columns: str = "*",
        where: Optional[str] = None,
        where_params: Optional[tuple] = None,
        order_by: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        """Select rows from a table."""
        query = f"SELECT {columns} FROM {table}"
        if where:
            query += f" WHERE {where}"
        if order_by:
            query += f" ORDER BY {order_by}"
        if limit:
            query += f" LIMIT {limit}"
        return await self.execute(query, where_params)

    async def select_one(
        self,
        table: str,
        columns: str = "*",
        where: Optional[str] = None,
        where_params: Optional[tuple] = None,
    ) -> Optional[dict[str, Any]]:
        """Select single row from a table."""
        results = await self.select(table, columns, where, where_params, limit=1)
        return results[0] if results else None

    def close(self):
        """Close the database connection."""
        if self._conn and not self._conn.closed:
            self._conn.close()


# =============================================================================
# CLIENT SINGLETON
# =============================================================================

_db_client: Optional[DatabaseClient] = None


def get_db() -> Optional[DatabaseClient]:
    """Get cached database client instance."""
    global _db_client

    if not settings.is_database_configured:
        logger.warning("Database not configured")
        return None

    if _db_client is None:
        try:
            _db_client = DatabaseClient(settings.database_url)
            logger.info("Database client initialized")
        except Exception as e:
            logger.error("Failed to initialize database client", error=str(e))
            return None

    return _db_client


# =============================================================================
# LEAD OPERATIONS
# =============================================================================


async def get_lead(lead_id: str) -> Optional[dict[str, Any]]:
    """Get a lead by ID."""
    db = get_db()
    if not db:
        return None
    return await db.select_one("leads", where="id = %s", where_params=(lead_id,))


async def update_lead(lead_id: str, data: dict[str, Any]) -> Optional[dict[str, Any]]:
    """Update a lead."""
    db = get_db()
    if not db:
        return None
    data["updated_at"] = "NOW()"
    return await db.update("leads", data, "id = %s", (lead_id,))


async def update_lead_status(lead_id: str, status: str) -> bool:
    """Update lead status."""
    db = get_db()
    if not db:
        return False
    try:
        await db.update(
            "leads",
            {"status": status, "last_contact_at": "NOW()"},
            "id = %s",
            (lead_id,),
        )
        return True
    except Exception:
        return False


# =============================================================================
# QUOTE OPERATIONS
# =============================================================================


async def get_quote_with_lead(quote_id: str) -> Optional[dict[str, Any]]:
    """Get quote with associated lead."""
    db = get_db()
    if not db:
        return None

    query = """
        SELECT
            q.*,
            l.id as lead_id,
            l.name as lead_name,
            l.email as lead_email,
            l.company as lead_company
        FROM quotes q
        LEFT JOIN leads l ON q.lead_id = l.id
        WHERE q.id = %s
    """
    return await db.execute_one(query, (quote_id,))


async def update_quote_status(
    quote_id: str, status: str, reason: Optional[str] = None
) -> bool:
    """Update quote status."""
    db = get_db()
    if not db:
        return False

    try:
        data = {"status": status}
        if status == "accepted":
            data["accepted_at"] = "NOW()"
        elif status == "declined":
            data["declined_at"] = "NOW()"
            if reason:
                data["decline_reason"] = reason

        await db.update("quotes", data, "id = %s", (quote_id,))
        return True
    except Exception:
        return False


# =============================================================================
# CONVERSATION OPERATIONS
# =============================================================================


async def get_conversation_with_lead(conversation_id: str) -> Optional[dict[str, Any]]:
    """Get conversation with associated lead."""
    db = get_db()
    if not db:
        return None

    query = """
        SELECT
            c.*,
            l.id as lead_id,
            l.name as lead_name,
            l.email as lead_email,
            l.company as lead_company,
            l.lead_score,
            l.problem_text,
            l.automation_area
        FROM conversations c
        LEFT JOIN leads l ON c.lead_id = l.id
        WHERE c.id = %s
    """
    return await db.execute_one(query, (conversation_id,))


async def update_conversation_status(conversation_id: str, status: str) -> bool:
    """Update conversation status."""
    db = get_db()
    if not db:
        return False

    try:
        data = {"status": status}
        if status == "completed":
            data["completed_at"] = "NOW()"

        await db.update("conversations", data, "id = %s", (conversation_id,))
        return True
    except Exception:
        return False
