import * as vscode from 'vscode';
import { verifyBackupFile } from './core/verifier';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('safebridge.verificarBackup', async () => {
        
        // 1. Show Open Dialog
        const fileUris = await vscode.window.showOpenDialog({
            canSelectMany: false,
            canSelectFiles: true,
            canSelectFolders: false,
            openLabel: 'Verificar Backup',
            filters: {
                'Archivos de Backup': ['sql', 'bak', 'bson']
            },
            title: 'Selecciona un archivo de copia de seguridad local'
        });

        if (!fileUris || fileUris.length === 0) {
            return; // Cancelled by user
        }

        const filePath = fileUris[0].fsPath;

        // 2. Show Progress Bar
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Window,
            cancellable: false,
            title: 'SafeBridge: Verificando integridad del backup...'
        }, async (progress) => {
            
            // Allow UI to render the progress before blocking
            progress.report({ increment: 0 });

            // 3. Execute Verification
            const result = await verifyBackupFile(filePath);

            // 4. Show Result
            if (result.status === 'Sano') {
                vscode.window.showInformationMessage(`✅ SafeBridge: El backup está Sano. ${result.message}`);
            } else {
                vscode.window.showErrorMessage(`❌ SafeBridge: El backup está Corrupto. ${result.message}`);
            }
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
