import logging
from src.domain.interfaces import DatabaseGateway
from src.domain.models import BackupFile

logger = logging.getLogger(__name__)


class VerifyBackupUseCase:
    def __init__(self, db_gateway: DatabaseGateway):
        self.db_gateway = db_gateway

    def execute(self, backup_file: BackupFile) -> bool:
        """
        Executes the backup verification process.
        """
        logger.info(f"Starting verification for backup file: {backup_file.path}")

        try:
            is_valid = self.db_gateway.verify_backup(backup_file)
            if is_valid:
                logger.info(
                    f"Success: Backup file {backup_file.path} is valid and intact."
                )
                return True
            else:
                logger.error(
                    f"Failure: Backup file {backup_file.path} is corrupt or invalid."
                )
                return False
        except Exception as e:
            logger.error(f"Error during backup verification: {str(e)}")
            return False
