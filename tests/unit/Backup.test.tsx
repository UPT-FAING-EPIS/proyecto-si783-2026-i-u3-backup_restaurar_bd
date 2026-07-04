import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Backup } from '../../src/pages/Backup';

describe('Backup Page', () => {
  it('renderiza el título Generar Backup', () => {
    render(<Backup />);
    expect(screen.getByText('Generar Backup')).toBeInTheDocument();
  });

  it('renderiza el subtítulo descriptivo', () => {
    render(<Backup />);
    expect(screen.getByText('Ejecuta volcados manuales y verifica en tiempo real')).toBeInTheDocument();
  });

  it('muestra el label de Seleccionar Conexión', () => {
    render(<Backup />);
    expect(screen.getByText('Seleccionar Conexión')).toBeInTheDocument();
  });

  it('carga las conexiones en el select', async () => {
    render(<Backup />);
    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });
  });

  it('muestra el botón Iniciar Backup', () => {
    render(<Backup />);
    expect(screen.getByText('Iniciar Backup')).toBeInTheDocument();
  });

  it('muestra la consola de LOG EN TIEMPO REAL', () => {
    render(<Backup />);
    expect(screen.getByText('LOG EN TIEMPO REAL')).toBeInTheDocument();
  });

  it('muestra mensaje de espera cuando no se ha iniciado el backup', () => {
    render(<Backup />);
    expect(screen.getByText('Esperando inicio de operación...')).toBeInTheDocument();
  });

  it('las conexiones se cargan en el dropdown', async () => {
    render(<Backup />);
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('el botón de backup está habilitado cuando hay conexiones', async () => {
    render(<Backup />);
    await waitFor(() => {
      const button = screen.getByText('Iniciar Backup').closest('button');
      expect(button).not.toBeDisabled();
    });
  });

  it('ejecuta el backup al hacer clic en el botón', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    render(<Backup />);
    
    await waitFor(() => {
      const button = screen.getByText('Iniciar Backup').closest('button');
      expect(button).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText('Iniciar Backup').closest('button')!);
    
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('generate_backup', expect.any(Object));
    });
  });

  it('muestra el resultado de backup exitoso', async () => {
    render(<Backup />);
    await waitFor(() => {
      expect(screen.getByText('Iniciar Backup')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Iniciar Backup').closest('button')!);

    await waitFor(() => {
      expect(screen.getByText('BACKUP VERIFICADO Y GUARDADO CORRECTAMENTE')).toBeInTheDocument();
    });
  });
});
