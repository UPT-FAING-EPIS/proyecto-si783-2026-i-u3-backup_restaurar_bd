import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Sidebar } from '../../src/components/Sidebar';

describe('Sidebar Component', () => {
  const mockSetView = vi.fn();

  it('renderiza el logo SB', () => {
    render(<Sidebar currentView="dashboard" setView={mockSetView} />);
    expect(screen.getByText('SB')).toBeInTheDocument();
  });

  it('renderiza los 4 botones de navegación', () => {
    render(<Sidebar currentView="dashboard" setView={mockSetView} />);
    expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
    expect(screen.getByTitle('Conexiones')).toBeInTheDocument();
    expect(screen.getByTitle('Generar Backup')).toBeInTheDocument();
    expect(screen.getByTitle('Historial')).toBeInTheDocument();
  });

  it('marca el botón Dashboard como activo por defecto', () => {
    render(<Sidebar currentView="dashboard" setView={mockSetView} />);
    const dashboardBtn = screen.getByTitle('Dashboard');
    expect(dashboardBtn.className).toContain('text-accent');
  });

  it('marca Conexiones como activo cuando currentView es connections', () => {
    render(<Sidebar currentView="connections" setView={mockSetView} />);
    const btn = screen.getByTitle('Conexiones');
    expect(btn.className).toContain('text-accent');
  });

  it('llama a setView al hacer clic en un botón de navegación', () => {
    render(<Sidebar currentView="dashboard" setView={mockSetView} />);
    fireEvent.click(screen.getByTitle('Conexiones'));
    expect(mockSetView).toHaveBeenCalledWith('connections');
  });

  it('llama a setView con "backup" al hacer clic en Generar Backup', () => {
    render(<Sidebar currentView="dashboard" setView={mockSetView} />);
    fireEvent.click(screen.getByTitle('Generar Backup'));
    expect(mockSetView).toHaveBeenCalledWith('backup');
  });

  it('llama a setView con "history" al hacer clic en Historial', () => {
    render(<Sidebar currentView="dashboard" setView={mockSetView} />);
    fireEvent.click(screen.getByTitle('Historial'));
    expect(mockSetView).toHaveBeenCalledWith('history');
  });

  it('muestra el indicador de estado de Docker', async () => {
    render(<Sidebar currentView="dashboard" setView={mockSetView} />);
    await waitFor(() => {
      const indicator = screen.getByTitle('Docker está corriendo');
      expect(indicator).toBeInTheDocument();
    });
  });

  it('los botones inactivos tienen estilo text-muted', () => {
    render(<Sidebar currentView="dashboard" setView={mockSetView} />);
    const backupBtn = screen.getByTitle('Generar Backup');
    expect(backupBtn.className).toContain('text-muted');
  });
});
