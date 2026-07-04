from dataclasses import dataclass


@dataclass
class DatabaseConfig:
    server: str
    database: str
    user: str
    password: str


@dataclass
class BackupFile:
    path: str
