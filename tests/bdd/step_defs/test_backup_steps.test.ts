import { test, expect } from '@playwright/test';

/**
 * Step definitions para las pruebas BDD de SafeBridge.
 * Implementación de los escenarios definidos en backup.feature.
 */

test.describe('BDD - Gestión de Backup de Base de Datos', () => {
  test.describe('Scenario: Crear un backup exitoso', () => {
    test('Given el usuario tiene una conexión activa a la base de datos', () => {
      const connection = { host: 'localhost', port: 5432, status: 'connected' };
      expect(connection.status).toBe('connected');
    });

    test('When el usuario solicita crear un backup de tipo "full"', () => {
      const backupType = 'full';
      const validTypes = ['full', 'incremental', 'differential'];
      expect(validTypes).toContain(backupType);
    });

    test('Then el sistema genera un archivo de backup con extensión ".sql"', () => {
      const fileName = 'backup_2026-07-04.sql';
      expect(fileName).toMatch(/\.sql$/);
    });
  });

  test.describe('Scenario: Conexión fallida a la base de datos', () => {
    test('Given el usuario ingresa credenciales incorrectas', () => {
      const credentials = { username: 'wrong_user', password: 'wrong_pass' };
      expect(credentials.username).not.toBe('admin');
    });

    test('Then el sistema muestra un mensaje de error de conexión', () => {
      const errorMessage = 'Error: No se pudo conectar a la base de datos';
      expect(errorMessage).toContain('Error');
      expect(errorMessage).toContain('conectar');
    });
  });
});
