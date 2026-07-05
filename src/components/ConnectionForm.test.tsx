import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionForm } from './ConnectionForm';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('ConnectionForm Component', () => {
  it('renders correctly with default empty state', () => {
    render(<ConnectionForm onClose={() => {}} onSave={() => {}} />);
    
    // Check if main elements are present
    expect(screen.getByText('Nueva Conexión')).toBeDefined();
    expect(screen.getByLabelText(/Nombre amigable/i)).toBeDefined();
    expect(screen.getByLabelText(/Host/i)).toBeDefined();
    expect(screen.getByText('Probar Conexión (Ping TCP)')).toBeDefined();
  });

  it('renders correctly with initial connection data', () => {
    const mockConn = {
      id: "123",
      name: "Prod DB",
      engine: "mysql",
      host: "10.0.0.1",
      port: 3306,
      username: "admin",
      database_name: "prod_data",
      backup_path: "/backups",
      use_ssl: true
    };

    render(<ConnectionForm connection={mockConn} onClose={() => {}} onSave={() => {}} />);
    
    // Should say Edit instead of New
    expect(screen.getByText('Editar Conexión')).toBeDefined();
    
    // Values should be populated
    const nameInput = screen.getByLabelText(/Nombre amigable/i) as HTMLInputElement;
    expect(nameInput.value).toBe("Prod DB");
    
    const hostInput = screen.getByLabelText(/Host/i) as HTMLInputElement;
    expect(hostInput.value).toBe("10.0.0.1");
  });
});
