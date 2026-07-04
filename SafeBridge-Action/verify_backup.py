import sys
import argparse
import logging
import os

# Ensure the src directory is in the path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.domain.models import BackupFile, DatabaseConfig
from src.infrastructure.sql_server_gateway import SqlServerGateway
from src.infrastructure.mysql_gateway import MySqlGateway
from src.infrastructure.postgres_gateway import PostgresGateway
from src.infrastructure.mongodb_gateway import MongoDbGateway
from src.use_cases.verify_backup_use_case import VerifyBackupUseCase

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def detect_sql_engine(file_path: str) -> str:
    """Reads the end of a .sql file to determine if it's MySQL or PostgreSQL."""
    try:
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            return "unknown"
        read_size = min(256, file_size)
        with open(file_path, "rb") as f:
            f.seek(-read_size, os.SEEK_END)
            buffer = f.read(read_size)
        end_str = buffer.decode("utf-8", errors="ignore")
        if "PostgreSQL database dump complete" in end_str:
            return "postgres"
        elif "Dump completed on" in end_str:
            return "mysql"
    except Exception:
        pass
    return "unknown"


def main():
    parser = argparse.ArgumentParser(description="Verify Database Backup Files")
    parser.add_argument(
        "--file",
        required=True,
        help="Path to the backup file to verify (.bak, .sql, .bson, .archive)",
    )
    parser.add_argument(
        "--server", required=False, help="SQL Server instance (required only for .bak)"
    )
    parser.add_argument(
        "--database",
        required=False,
        default="master",
        help="Database name to connect to initially",
    )
    parser.add_argument(
        "--user", required=False, help="SQL Server username (required only for .bak)"
    )
    parser.add_argument(
        "--password",
        required=False,
        help="SQL Server password (required only for .bak)",
    )

    args = parser.parse_args()
    backup_file = BackupFile(path=args.file)

    if not os.path.exists(args.file):
        logger.error(f"File not found: {args.file}")
        sys.exit(1)

    _, ext = os.path.splitext(args.file.lower())

    # 1. Determine Gateway based on Extension
    gateway = None
    if ext == ".bak":
        if not all([args.server, args.user, args.password]):
            logger.error(
                "--server, --user, and --password are required for .bak files (SQL Server verification)."
            )
            sys.exit(1)
        db_config = DatabaseConfig(
            server=args.server,
            database=args.database,
            user=args.user,
            password=args.password,
        )
        gateway = SqlServerGateway(config=db_config)
        logger.info("Detected SQL Server backup (.bak)")

    elif ext == ".sql":
        engine = detect_sql_engine(args.file)
        if engine == "postgres":
            gateway = PostgresGateway()
            logger.info("Detected PostgreSQL backup (.sql)")
        else:
            # Default to MySQL if it's .sql but doesn't have Postgres signature
            # The MySqlGateway will handle the final validation of the signature
            gateway = MySqlGateway()
            logger.info("Detected MySQL backup (.sql)")

    elif ext in [".bson", ".archive"]:
        gateway = MongoDbGateway()
        logger.info(f"Detected MongoDB backup ({ext})")

    else:
        logger.error(
            f"Unsupported file extension: {ext}. Supported: .bak, .sql, .bson, .archive"
        )
        sys.exit(1)

    # 2. Setup Dependencies
    use_case = VerifyBackupUseCase(db_gateway=gateway)

    # 3. Execute
    logger.info("Initializing backup verification process...")
    is_valid = use_case.execute(backup_file)

    if is_valid:
        logger.info("Verification completed successfully.")
        sys.exit(0)
    else:
        logger.error("Verification failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
