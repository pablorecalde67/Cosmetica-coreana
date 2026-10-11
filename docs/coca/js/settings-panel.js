// COCA K-BEAUTY - Admin Settings Panel
// Panel para configurar credenciales sin editar código

class SettingsPanel {
  constructor() {
    this.credentials = this.loadCredentials();
    this.init();
  }

  init() {
    // Crear botón flotante para settings
    const settingsBtn = document.createElement('button');
    settingsBtn.id = 'settingsBtn';
    settingsBtn.innerHTML = '⚙️';
    settingsBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #8B4789 0%, #A85FA3 100%);
      color: white;
      border: none;
      font-size: 24px;
      cursor: pointer;
      z-index: 999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    settingsBtn.addEventListener('click', () => this.openPanel());
    document.body.appendChild(settingsBtn);

    // Crear modal de settings
    const modal = document.createElement('div');
    modal.id = 'settingsModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1001;
      padding: 20px;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 24px;
        width: 100%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        ">
          <h2 style="margin: 0; color: #8B4789;">Configuración</h2>
          <button id="closeSettings" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
          ">✕</button>
        </div>

        <form id="settingsForm" style="display: flex; flex-direction: column; gap: 16px;">
          <!-- MercadoPago -->
          <div>
            <label style="
              display: block;
              font-weight: 600;
              margin-bottom: 8px;
              color: #333;
            ">
              💳 MercadoPago Public Key
            </label>
            <input
              type="text"
              id="mpPublicKey"
              placeholder="APP_USR-..."
              style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-family: monospace;
                font-size: 12px;
              "
            >
            <small style="color: #999;">
              Obtén en: https://www.mercadopago.com.ar/account/credentials
            </small>
          </div>

          <!-- OpenAI -->
          <div>
            <label style="
              display: block;
              font-weight: 600;
              margin-bottom: 8px;
              color: #333;
            ">
              🤖 OpenAI API Key
            </label>
            <input
              type="password"
              id="openaiKey"
              placeholder="sk-..."
              style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-family: monospace;
                font-size: 12px;
              "
            >
            <small style="color: #999;">
              Obtén en: https://platform.openai.com/api-keys
            </small>
          </div>

          <!-- YouTube -->
          <div>
            <label style="
              display: block;
              font-weight: 600;
              margin-bottom: 8px;
              color: #333;
            ">
              🎬 YouTube API Key
            </label>
            <input
              type="text"
              id="youtubeKey"
              placeholder="AIzaSy..."
              style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-family: monospace;
                font-size: 12px;
              "
            >
            <small style="color: #999;">
              Obtén en: https://console.cloud.google.com
            </small>
          </div>

          <!-- Firebase -->
          <div>
            <label style="
              display: block;
              font-weight: 600;
              margin-bottom: 8px;
              color: #333;
            ">
              🔥 Firebase Config (JSON)
            </label>
            <textarea
              id="firebaseConfig"
              placeholder='{"apiKey": "...", ...}'
              style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-family: monospace;
                font-size: 11px;
                height: 120px;
                resize: vertical;
              "
            ></textarea>
            <small style="color: #999;">
              Obtén en: https://console.firebase.google.com
            </small>
          </div>

          <!-- Instagram -->
          <div>
            <label style="
              display: block;
              font-weight: 600;
              margin-bottom: 8px;
              color: #333;
            ">
              📱 Instagram URL
            </label>
            <input
              type="text"
              id="instagramUrl"
              placeholder="https://instagram.com/..."
              style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 12px;
              "
            >
          </div>

          <!-- Facebook -->
          <div>
            <label style="
              display: block;
              font-weight: 600;
              margin-bottom: 8px;
              color: #333;
            ">
              📱 Facebook URL
            </label>
            <input
              type="text"
              id="facebookUrl"
              placeholder="https://facebook.com/..."
              style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 12px;
              "
            >
          </div>

          <!-- Botón Guardar -->
          <button
            type="submit"
            style="
              background: linear-gradient(135deg, #8B4789 0%, #A85FA3 100%);
              color: white;
              padding: 12px;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              font-size: 16px;
              margin-top: 12px;
            "
          >
            ✅ Guardar Configuración
          </button>

          <!-- Status -->
          <div id="statusMessage" style="
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            display: none;
            font-weight: 600;
          "></div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('closeSettings').addEventListener('click', () => this.closePanel());
    document.getElementById('settingsForm').addEventListener('submit', (e) => this.saveSettings(e));

    // Cargar valores guardados
    this.loadForm();
  }

  openPanel() {
    document.getElementById('settingsModal').style.display = 'flex';
  }

  closePanel() {
    document.getElementById('settingsModal').style.display = 'none';
  }

  loadForm() {
    if (this.credentials.mercadopago?.publicKey) {
      document.getElementById('mpPublicKey').value = this.credentials.mercadopago.publicKey;
    }
    if (this.credentials.openai?.apiKey) {
      document.getElementById('openaiKey').value = this.credentials.openai.apiKey;
    }
    if (this.credentials.youtube?.apiKey) {
      document.getElementById('youtubeKey').value = this.credentials.youtube.apiKey;
    }
    if (this.credentials.firebase) {
      document.getElementById('firebaseConfig').value = JSON.stringify(this.credentials.firebase, null, 2);
    }
    if (this.credentials.social?.instagram) {
      document.getElementById('instagramUrl').value = this.credentials.social.instagram;
    }
    if (this.credentials.social?.facebook) {
      document.getElementById('facebookUrl').value = this.credentials.social.facebook;
    }
  }

  async saveSettings(e) {
    e.preventDefault();

    try {
      // Recopilar valores
      const newCredentials = {
        mercadopago: {
          publicKey: document.getElementById('mpPublicKey').value
        },
        openai: {
          apiKey: document.getElementById('openaiKey').value
        },
        youtube: {
          apiKey: document.getElementById('youtubeKey').value
        },
        firebase: JSON.parse(document.getElementById('firebaseConfig').value || '{}'),
        social: {
          instagram: document.getElementById('instagramUrl').value,
          facebook: document.getElementById('facebookUrl').value
        }
      };

      // Guardar en localStorage
      localStorage.setItem('cocaCredentials', JSON.stringify(newCredentials));

      // Actualizar CONFIG global
      if (newCredentials.mercadopago?.publicKey) {
        CONFIG.mercadopago.publicKey = newCredentials.mercadopago.publicKey;
      }
      if (newCredentials.openai?.apiKey) {
        CONFIG.openai.apiKey = newCredentials.openai.apiKey;
      }
      if (newCredentials.youtube?.apiKey) {
        CONFIG.youtube.apiKey = newCredentials.youtube.apiKey;
      }
      if (newCredentials.firebase && Object.keys(newCredentials.firebase).length > 0) {
        Object.assign(CONFIG.firebase, newCredentials.firebase);
      }
      if (newCredentials.social?.instagram) {
        CONFIG.social.instagram = newCredentials.social.instagram;
      }
      if (newCredentials.social?.facebook) {
        CONFIG.social.facebook = newCredentials.social.facebook;
      }

      // Reinicializar Firebase si es necesario
      if (newCredentials.firebase && Object.keys(newCredentials.firebase).length > 0) {
        location.reload(); // Recargar para aplicar nuevos valores
      }

      // Mostrar mensaje de éxito
      const statusMsg = document.getElementById('statusMessage');
      statusMsg.style.display = 'block';
      statusMsg.style.background = '#4CAF50';
      statusMsg.style.color = 'white';
      statusMsg.textContent = '✅ Configuración guardada exitosamente';

      setTimeout(() => {
        statusMsg.style.display = 'none';
        this.closePanel();
      }, 2000);

    } catch (error) {
      console.error('Error guardando configuración:', error);
      const statusMsg = document.getElementById('statusMessage');
      statusMsg.style.display = 'block';
      statusMsg.style.background = '#f44336';
      statusMsg.style.color = 'white';
      statusMsg.textContent = '❌ Error: JSON inválido en Firebase Config';
    }
  }

  loadCredentials() {
    try {
      return JSON.parse(localStorage.getItem('cocaCredentials')) || {};
    } catch (e) {
      return {};
    }
  }
}

// Inicializar panel de settings
document.addEventListener('DOMContentLoaded', () => {
  new SettingsPanel();
});
