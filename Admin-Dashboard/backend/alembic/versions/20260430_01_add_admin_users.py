"""add admin_users table

Revision ID: 20260430_01
Revises: 20260407_01
Create Date: 2026-04-30
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "20260430_01"
down_revision = "20260407_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS admin_users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          full_name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'super_admin',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          last_login_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users (username)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users (role)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS admin_users")
