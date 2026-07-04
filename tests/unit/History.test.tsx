import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { History } from '../../src/pages/History';

describe('History Page', () => {
  it('renderiza el título Historial de Logs', () => {
    render(<History />);
    expect(screen.getByText('Historial de Logs')).toBeInTheDocument();
  });

  it('renderiza el subtítulo descriptivo', () => {
    render(<History />);
    expect(screen.getByText('Registro completo de operaciones de backup y validación')).toBeInTheDocument();
  });

  it('muestra el campo de búsqueda', () => {
    render(<History />);
    expect(screen.getByPlaceholderText('Buscar conexión...')).toBeInTheDocument();
  });

  it('muestra los filtros de motor y estado', () => {
    render(<History />);
    expect(screen.getByText('Todos los Motores')).toBeInTheDocument();
    expect(screen.getByText('Todos los Estados')).toBeInTheDocument();
  });

  it('muestra las columnas de la tabla', async () => {
    render(<History />);
    await waitFor(() => {
      expect(screen.getByText('Conexión')).toBeInTheDocument();
      expect(screen.getByText('Motor')).toBeInTheDocument();
      expect(screen.getByText('Fecha')).toBeInTheDocument();
      expect(screen.getByText('Duración')).toBeInTheDocument();
      expect(screen.getByText('Tamaño')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();
    });
  });

  it('carga y muestra los registros de historial', async () => {
    render(<History />);
    await waitFor(() => {
      expect(screen.getByText('Producción PG')).toBeInTheDocument();
      expect(screen.getByText('Staging MySQL')).toBeInTheDocument();
    });
  });

  it('muestra el estado OK y FAIL correctamente', async () => {
    render(<History />);
    await waitFor(() => {
      expect(screen.getByText('OK')).toBeInTheDocument();
      expect(screen.getByText('FAIL')).toBeInTheDocument();
    });
  });

  it('muestra la duración en segundos', async () => {
    render(<History />);
    await waitFor(() => {
      expect(screen.getByText('45s')).toBeInTheDocument();
      expect(screen.getByText('3s')).toBeInTheDocument();
    });
  });

  it('muestra el tamaño formateado', async () => {
    render(<History />);
    await waitFor(() => {
      expect(screen.getByText('1 MB')).toBeInTheDocument();
      expect(screen.getByText('0 B')).toBeInTheDocument();
    });
  });

  it('filtra por nombre al escribir en la búsqueda', async () => {
    render(<History />);
    await waitFor(() => {
      expect(screen.getByText('Producción PG')).toBeInTheDocument();
    });
    const input = screen.getByPlaceholderText('Buscar conexión...');
    fireEvent.change(input, { target: { value: 'Staging' } });
    await waitFor(() => {
      expect(screen.getByText('Staging MySQL')).toBeInTheDocument();
      expect(screen.queryByText('Producción PG')).not.toBeInTheDocument();
    });
  });

  it('abre el modal de detalles al clic en un registro', async () => {
    render(<History />);
    await waitFor(() => {
      expect(screen.getByText('Producción PG')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Producción PG'));
    await waitFor(() => {
      expect(screen.getByText('Detalles del Log')).toBeInTheDocument();
      expect(screen.getByText('ID Operación')).toBeInTheDocument();
    });
  });

  it('muestra detalles completos en el modal', async () => {
    render(<History />);
    await waitFor(() => expect(screen.getByText('Producción PG')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Producción PG'));
    await waitFor(() => {
      expect(screen.getByText('/backups/pg/app_prod_2026-07-04.sql')).toBeInTheDocument();
      expect(screen.getByText('Exitosa')).toBeInTheDocument();
    });
  });
});
