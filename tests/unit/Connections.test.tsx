import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Connections } from '../../src/pages/Connections';

describe('Connections Page', () => {
  it('renderiza el título Conexiones', () => {
    render(<Connections />);
    expect(screen.getByText('Conexiones')).toBeInTheDocument();
  });

  it('renderiza el subtítulo descriptivo', () => {
    render(<Connections />);
    expect(screen.getByText('Gestiona tus credenciales de base de datos')).toBeInTheDocument();
  });

  it('muestra el botón de Nueva Conexión', () => {
    render(<Connections />);
    expect(screen.getByText('Nueva Conexión')).toBeInTheDocument();
  });

  it('carga y muestra las conexiones existentes', async () => {
    render(<Connections />);
    await waitFor(() => {
      expect(screen.getByText('Producción PG')).toBeInTheDocument();
      expect(screen.getByText('Staging MySQL')).toBeInTheDocument();
    });
  });

  it('muestra el host y puerto de cada conexión', async () => {
    render(<Connections />);
    await waitFor(() => {
      expect(screen.getByText('db.prod.local:5432')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.50:3306')).toBeInTheDocument();
    });
  });

  it('muestra la base de datos de cada conexión', async () => {
    render(<Connections />);
    await waitFor(() => {
      expect(screen.getByText('app_prod')).toBeInTheDocument();
      expect(screen.getByText('app_staging')).toBeInTheDocument();
    });
  });

  it('muestra el usuario de cada conexión', async () => {
    render(<Connections />);
    await waitFor(() => {
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('root')).toBeInTheDocument();
    });
  });

  it('muestra las etiquetas de motor con colores', async () => {
    render(<Connections />);
    await waitFor(() => {
      expect(screen.getByText('postgres')).toBeInTheDocument();
      expect(screen.getByText('mysql')).toBeInTheDocument();
    });
  });

  it('muestra botones de Editar y Eliminar para cada conexión', async () => {
    render(<Connections />);
    await waitFor(() => {
      const editButtons = screen.getAllByText('Editar');
      const deleteButtons = screen.getAllByText('Eliminar');
      expect(editButtons.length).toBe(2);
      expect(deleteButtons.length).toBe(2);
    });
  });

  it('abre el formulario al hacer clic en Nueva Conexión', async () => {
    render(<Connections />);
    fireEvent.click(screen.getByText('Nueva Conexión'));
    await waitFor(() => {
      expect(screen.getByText('Nombre amigable *')).toBeInTheDocument();
    });
  });

  it('abre el formulario de edición al hacer clic en Editar', async () => {
    render(<Connections />);
    await waitFor(() => {
      const editButtons = screen.getAllByText('Editar');
      fireEvent.click(editButtons[0]);
    });
    await waitFor(() => {
      expect(screen.getByText('Editar Conexión')).toBeInTheDocument();
    });
  });
});
