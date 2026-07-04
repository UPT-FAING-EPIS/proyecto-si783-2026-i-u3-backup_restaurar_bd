import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ─── Mock: @tauri-apps/api/core ──────────────────────────────────────────────
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn((command: string) => {
    switch (command) {
      case 'check_docker':
        return Promise.resolve(true);
      case 'get_dashboard_stats':
        return Promise.resolve({
          total_connections: 3,
          successful_backups: 12,
          failed_backups: 1,
          total_bytes_backed_up: 5242880, // 5 MB
          recent_activity: [
            {
              id: '1',
              connection_name: 'Producción PG',
              engine: 'postgres',
              status: 'OK',
              started_at: '2026-07-04 10:30:00',
              file_size_bytes: 1048576,
            },
            {
              id: '2',
              connection_name: 'Staging MySQL',
              engine: 'mysql',
              status: 'FAIL',
              started_at: '2026-07-04 09:15:00',
              file_size_bytes: 0,
            },
          ],
        });
      case 'list_connections':
        return Promise.resolve([
          {
            id: 'conn-1',
            name: 'Producción PG',
            engine: 'postgres',
            host: 'db.prod.local',
            port: 5432,
            username: 'admin',
            database_name: 'app_prod',
            backup_path: '/backups/pg',
          },
          {
            id: 'conn-2',
            name: 'Staging MySQL',
            engine: 'mysql',
            host: '192.168.1.50',
            port: 3306,
            username: 'root',
            database_name: 'app_staging',
            backup_path: '/backups/mysql',
          },
        ]);
      case 'list_logs':
        return Promise.resolve([
          {
            id: 'log-1',
            connection_name: 'Producción PG',
            engine: 'postgres',
            status: 'OK',
            started_at: '2026-07-04 10:30:00',
            finished_at: '2026-07-04 10:30:45',
            duration_seconds: 45,
            file_size_bytes: 1048576,
            file_path: '/backups/pg/app_prod_2026-07-04.sql',
            restore_verified: true,
            error_message: null,
            full_logs: 'pg_dump: starting\npg_dump: done',
          },
          {
            id: 'log-2',
            connection_name: 'Staging MySQL',
            engine: 'mysql',
            status: 'FAIL',
            started_at: '2026-07-04 09:15:00',
            finished_at: '2026-07-04 09:15:03',
            duration_seconds: 3,
            file_size_bytes: 0,
            file_path: '',
            restore_verified: false,
            error_message: 'Connection refused',
            full_logs: null,
          },
        ]);
      case 'test_connection':
        return Promise.resolve(true);
      case 'create_connection':
        return Promise.resolve({ id: 'new-conn' });
      case 'update_connection':
        return Promise.resolve(true);
      case 'delete_connection':
        return Promise.resolve(true);
      case 'generate_backup':
        return Promise.resolve({ verified: true, file_path: '/backups/test.sql' });
      default:
        return Promise.resolve(null);
    }
  }),
}));

// ─── Mock: @tauri-apps/api/event ─────────────────────────────────────────────
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

// ─── Mock: @tauri-apps/plugin-dialog ─────────────────────────────────────────
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(() => Promise.resolve('/selected/path')),
}));

// ─── Mock: react-hot-toast ───────────────────────────────────────────────────
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: ({ children }: any) => children || null,
}));

// ─── Mock: DOM APIs not available in jsdom ───────────────────────────────────
Element.prototype.scrollIntoView = vi.fn();
window.confirm = vi.fn(() => true);
