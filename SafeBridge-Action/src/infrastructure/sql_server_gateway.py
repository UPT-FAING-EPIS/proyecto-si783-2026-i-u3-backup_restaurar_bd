import logging
import pyodbc
from src.domain.interfaces import DatabaseGateway
from src.domain.models import BackupFile, DatabaseConfig

logger = logging.getLogger(__name__)


class SqlServerGateway(DatabaseGateway):
    def __init__(self, config: DatabaseConfig):
        self.config = config

    def _get_connection(self):
        """
        Creates and returns a pyodbc connection to the SQL Server.
        Uses ODBC Driver 18 for SQL Server (standard for modern setups, including Linux containers).
        """
        conn_str = (
            f"DRIVER={{ODBC Driver 18 for SQL Server}};"
            f"SERVER={self.config.server};"
            f"DATABASE={self.config.database};"
            f"UID={self.config.user};"
            f"PWD={self.config.password};"
            f"TrustServerCertificate=yes;"  # Needed for default dev environments/Docker containers
        )
        return pyodbc.connect(conn_str, autocommit=True)

    def verify_backup(self, backup: BackupFile) -> bool:
        """
        Verifies the backup file using RESTORE VERIFYONLY.
        """
        query = "RESTORE VERIFYONLY FROM DISK = ?"

        try:
            with self._get_connection() as conn:
                with conn.cursor() as cursor:
                    logger.debug(
                        f"Executing: RESTORE VERIFYONLY FROM DISK = '{backup.path}'"
                    )
                    cursor.execute(query, (backup.path,))
                    # Some drivers/versions might return multiple result sets for this command
                    while cursor.nextset():
                        pass
            return True
        except pyodbc.Error as e:
            logger.error(f"Database error during verification: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during verification: {e}")
            return False
