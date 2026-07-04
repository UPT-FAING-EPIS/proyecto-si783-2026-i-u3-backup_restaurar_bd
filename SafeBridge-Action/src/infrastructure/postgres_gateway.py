import os
import logging
from src.domain.interfaces import DatabaseGateway
from src.domain.models import BackupFile

logger = logging.getLogger(__name__)


class PostgresGateway(DatabaseGateway):
    def verify_backup(self, backup: BackupFile) -> bool:
        """
        Verifies a PostgreSQL backup file by checking for the 'PostgreSQL database dump complete' signature.
        """
        try:
            file_size = os.path.getsize(backup.path)
            if file_size == 0:
                logger.error("PostgreSQL backup file is empty (0 bytes).")
                return False

            read_size = min(256, file_size)
            with open(backup.path, "rb") as f:
                f.seek(-read_size, os.SEEK_END)
                buffer = f.read(read_size)

            end_str = buffer.decode("utf-8", errors="ignore")
            if "PostgreSQL database dump complete" in end_str:
                logger.debug("PostgreSQL 'dump complete' signature found.")
                return True
            else:
                logger.error(
                    "Warning: PostgreSQL 'dump complete' signature not found at the end of the file."
                )
                return False

        except Exception as e:
            logger.error(f"Error reading PostgreSQL backup file: {e}")
            return False
