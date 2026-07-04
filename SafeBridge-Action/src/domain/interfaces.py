from abc import ABC, abstractmethod
from src.domain.models import BackupFile


class DatabaseGateway(ABC):
    @abstractmethod
    def verify_backup(self, backup: BackupFile) -> bool:
        """
        Verifies the integrity of the backup file.
        Returns True if valid, False if corrupt or invalid.
        """
        pass
