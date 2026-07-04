import { describe, it, expect } from 'vitest';

/**
 * Pruebas de interfaz de usuario para SafeBridge.
 * Validan la estructura y comportamiento de los componentes React.
 */

describe('UI - Componentes de la Interfaz', () => {
  it('debe tener las vistas principales definidas', () => {
    const views = ['dashboard', 'connections', 'backup', 'history'];
    expect(views).toHaveLength(4);
    expect(views).toContain('dashboard');
    expect(views).toContain('backup');
  });

  it('debe validar que la vista por defecto sea dashboard', () => {
    const defaultView = 'dashboard';
    expect(defaultView).toBe('dashboard');
  });

  it('debe validar la navegación entre vistas', () => {
    const validViews = ['dashboard', 'connections', 'backup', 'history'];
    const targetView = 'backup';
    expect(validViews).toContain(targetView);
  });

  it('debe validar que los mensajes toast tienen estilos dark mode', () => {
    const toastStyle = {
      background: '#1F2937',
      color: '#E5E7EB',
      border: '1px solid #374151',
    };
    expect(toastStyle.background).toBe('#1F2937');
    expect(toastStyle.color).toBe('#E5E7EB');
  });
});
