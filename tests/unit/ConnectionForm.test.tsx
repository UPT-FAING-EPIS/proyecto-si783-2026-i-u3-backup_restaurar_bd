import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConnectionForm } from '../../src/components/ConnectionForm';

describe('ConnectionForm Component', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  it('renderiza el título Nueva Conexión cuando no hay connection', () => {
    render(<ConnectionForm onClose={mockOnClose} onSave={mockOnSave} />);
    expect(screen.getByText('Nueva Conexión')).toBeInTheDocument();
  });

  it('renderiza el título Editar Conexión cuando se pasa connection', () => {
    render(<ConnectionForm connection={{ id: '1', name: 'Test' }} onClose={mockOnClose} onSave={mockOnSave} />);
    expect(screen.getByText('Editar Conexión')).toBeInTheDocument();
  });

  it('muestra todos los campos del formulario', () => {
    render(<ConnectionForm onClose={mockOnClose} onSave={mockOnSave} />);
    expect(screen.getByText('Nombre amigable *')).toBeInTheDocument();
    expect(screen.getByText('Motor *')).toBeInTheDocument();
    expect(screen.getByText('Host *')).toBeInTheDocument();
    expect(screen.getByText('Puerto *')).toBeInTheDocument();
    expect(screen.getByText('Usuario *')).toBeInTheDocument();
    expect(screen.getByText('Nombre de la Base de Datos *')).toBeInTheDocument();
    expect(screen.getByText('Carpeta de Backups *')).toBeInTheDocument();
  });

  it('muestra las opciones de motor de base de datos', () => {
    render(<ConnectionForm onClose={mockOnClose} onSave={mockOnSave} />);
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('MySQL')).toBeInTheDocument();
    expect(screen.getByText('SQL Server')).toBeInTheDocument();
    expect(screen.getByText('MongoDB')).toBeInTheDocument();
  });

  it('muestra el botón de Probar Conexión', () => {
    render(<ConnectionForm onClose={mockOnClose} onSave={mockOnSave} />);
    expect(screen.getByText('Probar Conexión (Ping TCP)')).toBeInTheDocument();
  });

  it('muestra los botones Cancelar y Guardar', () => {
    render(<ConnectionForm onClose={mockOnClose} onSave={mockOnSave} />);
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeInTheDocument();
  });

  it('llama a onClose al hacer clic en Cancelar', () => {
    render(<ConnectionForm onClose={mockOnClose} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('el puerto por defecto es 5432 para postgres', () => {
    render(<ConnectionForm onClose={mockOnClose} onSave={mockOnSave} />);
    const portInput = screen.getByDisplayValue('5432');
    expect(portInput).toBeInTheDocument();
  });

  it('muestra el placeholder de ruta de backups', () => {
    render(<ConnectionForm onClose={mockOnClose} onSave={mockOnSave} />);
    expect(screen.getByPlaceholderText('Selecciona o escribe una ruta...')).toBeInTheDocument();
  });

  it('prueba la conexión TCP al hacer clic', async () => {
    render(<ConnectionForm onClose={mockOnClose} onSave={mockOnSave} />);
    fireEvent.click(screen.getByText('Probar Conexión (Ping TCP)'));
    await waitFor(() => {
      expect(screen.getByText('Conexión TCP exitosa')).toBeInTheDocument();
    });
  });
});
