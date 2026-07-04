import os
import logging
from src.domain.interfaces import DatabaseGateway
from src.domain.models import BackupFile

logger = logging.getLogger(__name__)


class MySqlGateway(DatabaseGateway):
    def verify_backup(self, backup: BackupFile) -> bool:
        """
        Verifies a MySQL backup file by checking for the 'Dump completed on' signature at the end.
        """
        try:
            file_size = os.path.getsize(backup.path)
            if file_size == 0:
                logger.error("MySQL backup file is empty (0 bytes).")
                return False

            read_size = min(256, file_size)
            with open(backup.path, "rb") as f:
                f.seek(-read_size, os.SEEK_END)
                buffer = f.read(read_size)

            end_str = buffer.decode("utf-8", errors="ignore")
            if "Dump completed on" in end_str:
                logger.debug("MySQL 'Dump completed on' signature found.")
                return True
            else:
                logger.error(
                    "Warning: MySQL 'Dump completed on' signature not found at the end of the file."
                )
                return False

        except Exception as e:
            logger.error(f"Error reading MySQL backup file: {e}")
            return False
