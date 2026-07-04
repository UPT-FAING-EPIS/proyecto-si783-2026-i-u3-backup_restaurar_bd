import * as fs from 'fs';
import * as path from 'path';

export interface VerificationResult {
    status: 'Sano' | 'Corrupto';
    message: string;
}

export async function verifyBackupFile(filePath: string): Promise<VerificationResult> {
    try {
        const ext = path.extname(filePath).toLowerCase();
        
        // Ensure file is readable and get stats
        const stats = await fs.promises.stat(filePath);

        if (stats.size === 0) {
            return {
                status: 'Corrupto',
                message: 'El archivo está vacío (tamaño 0 bytes).'
            };
        }

        // Validate by extension
        if (ext === '.sql') {
            return await verifySqlBackup(filePath, stats.size);
        } else if (ext === '.bak' || ext === '.bson') {
            return verifyBinaryBackup(filePath, stats);
        } else {
            return {
                status: 'Corrupto',
                message: `Extensión de archivo no soportada: ${ext}`
            };
        }

    } catch (error: any) {
        return {
            status: 'Corrupto',
            message: `Error al acceder al archivo: ${error.message || error}`
        };
    }
}

async function verifySqlBackup(filePath: string, fileSize: number): Promise<VerificationResult> {
    // We only read the last 256 bytes
    const readSize = Math.min(256, fileSize);
    const position = fileSize - readSize;
    const buffer = Buffer.alloc(readSize);

    let fileHandle: fs.promises.FileHandle | null = null;
    try {
        fileHandle = await fs.promises.open(filePath, 'r');
        await fileHandle.read(buffer, 0, readSize, position);
        
        const tailContent = buffer.toString('utf-8');
        
        const hasMySQLSignature = tailContent.includes('Dump completed on');
        const hasPgSQLSignature = tailContent.includes('PostgreSQL database dump complete');

        if (hasMySQLSignature || hasPgSQLSignature) {
            return {
                status: 'Sano',
                message: 'Firma de finalización encontrada correctamente (.sql validado).'
            };
        } else {
            return {
                status: 'Corrupto',
                message: 'No se encontró la firma de finalización esperada en el archivo .sql.'
            };
        }

    } finally {
        if (fileHandle) {
            await fileHandle.close();
        }
    }
}

function verifyBinaryBackup(filePath: string, stats: fs.Stats): VerificationResult {
    // Since stat passed and size > 0, we consider it healthy for .bak and .bson
    return {
        status: 'Sano',
        message: `El archivo ${path.basename(filePath)} tiene un tamaño válido (${stats.size} bytes) y es legible.`
    };
}
