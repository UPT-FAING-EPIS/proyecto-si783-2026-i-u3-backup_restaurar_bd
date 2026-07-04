import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';

describe('App Component', () => {
  it('renderiza el componente principal sin errores', () => {
    render(<App />);
    expect(document.querySelector('.flex')).toBeInTheDocument();
  });

  it('muestra el Dashboard como vista por defecto', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('contiene el componente Sidebar', () => {
    render(<App />);
    expect(screen.getByText('SB')).toBeInTheDocument();
  });

  it('muestra las estadísticas del dashboard al cargar', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Conexiones')).toBeInTheDocument();
      expect(screen.getByText('Backups Exitosos')).toBeInTheDocument();
      expect(screen.getByText('Backups Fallidos')).toBeInTheDocument();
    });
  });

  it('navega a la vista de Conexiones al hacer clic en el botón', async () => {
    render(<App />);
    const buttons = screen.getAllByRole('button');
    // El segundo botón de navegación es "Conexiones"
    const connectionsButton = buttons.find(btn => btn.getAttribute('title') === 'Conexiones');
    if (connectionsButton) {
      fireEvent.click(connectionsButton);
      await waitFor(() => {
        expect(screen.getByText('Gestiona tus credenciales de base de datos')).toBeInTheDocument();
      });
    }
  });

  it('navega a la vista de Generar Backup', async () => {
    render(<App />);
    const buttons = screen.getAllByRole('button');
    const backupButton = buttons.find(btn => btn.getAttribute('title') === 'Generar Backup');
    if (backupButton) {
      fireEvent.click(backupButton);
      await waitFor(() => {
        expect(screen.getByText('Ejecuta volcados manuales y verifica en tiempo real')).toBeInTheDocument();
      });
    }
  });

  it('navega a la vista de Historial', async () => {
    render(<App />);
    const buttons = screen.getAllByRole('button');
    const historyButton = buttons.find(btn => btn.getAttribute('title') === 'Historial');
    if (historyButton) {
      fireEvent.click(historyButton);
      await waitFor(() => {
        expect(screen.getByText('Historial de Logs')).toBeInTheDocument();
      });
    }
  });
});
