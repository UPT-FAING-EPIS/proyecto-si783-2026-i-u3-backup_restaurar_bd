import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dashboard } from '../../src/pages/Dashboard';

describe('Dashboard Page', () => {
  it('renderiza el título Dashboard', () => {
    render(<Dashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renderiza el subtítulo descriptivo', () => {
    render(<Dashboard />);
    expect(screen.getByText('Vista general del estado de tus backups')).toBeInTheDocument();
  });

  it('muestra la tarjeta de Conexiones con datos del mock', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Conexiones')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('muestra la tarjeta de Backups Exitosos', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Backups Exitosos')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });

  it('muestra la tarjeta de Backups Fallidos', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Backups Fallidos')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('muestra la tarjeta de Datos Resguardados con formato correcto', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Datos Resguardados')).toBeInTheDocument();
      expect(screen.getByText('5 MB')).toBeInTheDocument();
    });
  });

  it('muestra la sección de Actividad Reciente', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
    });
  });

  it('muestra las actividades recientes con nombre de conexión', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Producción PG')).toBeInTheDocument();
      expect(screen.getByText('Staging MySQL')).toBeInTheDocument();
    });
  });

  it('muestra las etiquetas de motor de base de datos', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('postgres')).toBeInTheDocument();
      expect(screen.getByText('mysql')).toBeInTheDocument();
    });
  });

  it('renderiza las 4 tarjetas KPI', async () => {
    render(<Dashboard />);
    await waitFor(() => {
      const kpiLabels = ['Conexiones', 'Backups Exitosos', 'Backups Fallidos', 'Datos Resguardados'];
      kpiLabels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });
});
