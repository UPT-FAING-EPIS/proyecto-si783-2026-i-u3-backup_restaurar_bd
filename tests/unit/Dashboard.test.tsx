import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Dashboard } from '../../src/pages/Dashboard';

describe('Dashboard Page', () => {
  it('renderiza el título Dashboard', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renderiza el subtítulo descriptivo', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    expect(screen.getByText('Vista general del estado de tus backups')).toBeInTheDocument();
  });

  it('muestra la tarjeta de Conexiones con datos del mock', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    await waitFor(() => {
      expect(screen.getByText('Conexiones')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('muestra la tarjeta de Backups Exitosos', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    await waitFor(() => {
      expect(screen.getByText('Backups Exitosos')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });

  it('muestra la tarjeta de Backups Fallidos', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    await waitFor(() => {
      expect(screen.getByText('Backups Fallidos')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('muestra la tarjeta de Datos Resguardados con formato correcto', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    await waitFor(() => {
      expect(screen.getByText('Datos Resguardados')).toBeInTheDocument();
      expect(screen.getByText('5 MB')).toBeInTheDocument();
    });
  });

  it('muestra la sección de Actividad Reciente', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    await waitFor(() => {
      expect(screen.getByText('Actividad Reciente')).toBeInTheDocument();
    });
  });

  it('muestra las actividades recientes con nombre de conexión', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    await waitFor(() => {
      expect(screen.getByText('Producción PG')).toBeInTheDocument();
      expect(screen.getByText('Staging MySQL')).toBeInTheDocument();
    });
  });

  it('muestra las etiquetas de motor de base de datos', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    await waitFor(() => {
      expect(screen.getByText('postgres')).toBeInTheDocument();
      expect(screen.getByText('mysql')).toBeInTheDocument();
    });
  });

  it('renderiza las 4 tarjetas KPI', async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    await waitFor(() => {
      const kpiLabels = ['Conexiones', 'Backups Exitosos', 'Backups Fallidos', 'Datos Resguardados'];
      kpiLabels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });
});
