import os
import logging
from src.domain.interfaces import DatabaseGateway
from src.domain.models import BackupFile

logger = logging.getLogger(__name__)


class MongoDbGateway(DatabaseGateway):
    def verify_backup(self, backup: BackupFile) -> bool:
        """
        Verifies a MongoDB backup file by checking if it exists and is strictly greater than 0 bytes.
        """
        try:
            file_size = os.path.getsize(backup.path)
            if file_size == 0:
                logger.error("MongoDB backup file is empty (0 bytes).")
                return False

            logger.debug(f"MongoDB backup file is valid (Size: {file_size} bytes).")
            return True

        except Exception as e:
            logger.error(f"Error reading MongoDB backup file: {e}")
            return False
