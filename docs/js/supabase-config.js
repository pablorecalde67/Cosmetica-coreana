/**
 * Configuración dinámica de Supabase
 * Los tokens se cargan desde localStorage (guardados en config.html)
 */

class SupabaseConfig {
  constructor() {
    this.loadFromStorage();
  }

  loadFromStorage() {
    this.SUPABASE_URL = localStorage.getItem('SUPABASE_URL') || 'https://sky-grass.supabase.co';
    this.SUPABASE_ANON_KEY = localStorage.getItem('SUPABASE_ANON_KEY');
    this.SUPABASE_SERVICE_KEY = localStorage.getItem('SUPABASE_SERVICE_KEY');
    this.isConfigured = this.SUPABASE_ANON_KEY && this.SUPABASE_SERVICE_KEY;
  }

  checkConfiguration() {
    if (!this.isConfigured) {
      const message = '⚠️ Configuración de Supabase no encontrada. Redirigiendo a configuración...';
      console.warn(message);

      // Redirigir a configuración después de 2 segundos
      setTimeout(() => {
        window.location.href = 'config.html';
      }, 2000);

      return false;
    }
    return true;
  }

  getHeaders(useServiceKey = false) {
    const key = useServiceKey ? this.SUPABASE_SERVICE_KEY : this.SUPABASE_ANON_KEY;
    return {
      'Authorization': `Bearer ${key}`,
      'apikey': key,
      'Content-Type': 'application/json',
    };
  }

  async testConnection() {
    try {
      const response = await fetch(`${this.SUPABASE_URL}/rest/v1/`, {
        headers: this.getHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Crear instancia global
const supabaseConfig = new SupabaseConfig();

// Si no está configurado, redirigir inmediatamente
if (!supabaseConfig.isConfigured && !window.location.pathname.includes('config.html')) {
  console.warn('Supabase not configured. Redirecting to config.html');
  window.location.href = 'config.html';
}
