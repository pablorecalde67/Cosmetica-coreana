// COCA K-BEAUTY - Skin Analyzer with OpenAI Vision API

let cameraStream = null;
let analyzerResults = null;

// Iniciar cámara
document.addEventListener('DOMContentLoaded', () => {
  const btnStartCamera = document.getElementById('btnStartCamera');
  const btnTakePhoto = document.getElementById('btnTakePhoto');
  const btnUploadPhoto = document.getElementById('btnUploadPhoto');
  const photoInput = document.getElementById('photoInput');
  const btnGetRecommendations = document.getElementById('btnGetRecommendations');

  if (btnStartCamera) {
    btnStartCamera.addEventListener('click', startCamera);
  }
  if (btnTakePhoto) {
    btnTakePhoto.addEventListener('click', capturePhoto);
  }
  if (btnUploadPhoto) {
    btnUploadPhoto.addEventListener('click', () => photoInput.click());
  }
  if (photoInput) {
    photoInput.addEventListener('change', handlePhotoUpload);
  }
  if (btnGetRecommendations) {
    btnGetRecommendations.addEventListener('click', getRecommendations);
  }
});

// Iniciar cámara
async function startCamera() {
  try {
    const video = document.getElementById('cameraFeed');
    const btnTakePhoto = document.getElementById('btnTakePhoto');

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false
    });

    video.srcObject = cameraStream;
    btnTakePhoto.disabled = false;

    console.log('✅ Cámara iniciada');
  } catch (error) {
    console.error('❌ Error accediendo a cámara:', error);
    alert('No se pudo acceder a la cámara. Intenta subir una foto en su lugar.');
  }
}

// Capturar foto de cámara
function capturePhoto() {
  const video = document.getElementById('cameraFeed');
  const canvas = document.getElementById('photoCanvas');
  const ctx = canvas.getContext('2d');

  // Configurar canvas con el tamaño del video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Dibujar foto
  ctx.drawImage(video, 0, 0);

  // Convertir a blob y procesar
  canvas.toBlob(analyzePhoto, 'image/jpeg', 0.9);

  // Detener cámara
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
  }
}

// Manejar subida de foto
function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (file) {
    analyzePhoto(file);
  }
}

// Analizar foto con OpenAI Vision API
async function analyzePhoto(photoBlob) {
  try {
    console.log('🔄 Analizando foto con IA...');

    // Mostrar paso 2 (loading)
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');

    // Convertir blob a base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Image = e.target.result.split(',')[1];

      try {
        // Enviar a OpenAI Vision API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.openai.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4-vision-preview',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: CONFIG.skinAnalysis.systemPrompt
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${base64Image}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 1024
          })
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const analysisText = data.choices[0].message.content;

        // Parsear respuesta JSON
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analyzerResults = JSON.parse(jsonMatch[0]);
          showAnalysisResults(analyzerResults);
        } else {
          throw new Error('Invalid response format');
        }

      } catch (error) {
        console.error('❌ Error en análisis:', error);
        alert('❌ Error analizando la foto. Asegúrate de que tu API key sea correcta.');
        document.getElementById('step2').classList.add('hidden');
        document.getElementById('step1').classList.remove('hidden');
      }
    };
    reader.readAsDataURL(photoBlob);

  } catch (error) {
    console.error('❌ Error procesando foto:', error);
    alert('Error procesando la foto');
  }
}

// Mostrar resultados del análisis
function showAnalysisResults(results) {
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step3').classList.remove('hidden');

  const resultsContainer = document.getElementById('resultsContainer');

  resultsContainer.innerHTML = `
    <div class="result-item">
      <strong>🧴 Tipo de Piel:</strong>
      <p>${results.skinType}</p>
    </div>

    <div class="result-item">
      <strong>✨ Características:</strong>
      <p>${results.characteristics?.join(', ') || 'N/A'}</p>
    </div>

    <div class="result-item">
      <strong>⚠️ Problemas Detectados:</strong>
      <p>${results.problems?.join(', ') || 'Ninguno detectado'}</p>
    </div>

    <div class="result-item">
      <strong>🎯 Necesidades de Cuidado:</strong>
      <p>${results.needs?.join(', ') || 'Mantenimiento general'}</p>
    </div>

    <div class="result-item">
      <strong>💡 Recomendaciones:</strong>
      <p>${results.recommendations?.join(', ') || 'Ver productos recomendados'}</p>
    </div>
  `;
}

// Obtener recomendaciones de productos
async function getRecommendations() {
  if (!analyzerResults) {
    alert('❌ Primero debes analizar tu piel');
    return;
  }

  console.log('📦 Obteniendo productos recomendados...');

  // Cerrar modal de análisis
  document.getElementById('skinAnalyzerModal').classList.add('hidden');

  // Abrir modal de recomendaciones
  document.getElementById('recommendationsModal').classList.remove('hidden');

  // Cargar recomendaciones (esto se completará en un próximo paso)
  loadRecommendedProducts(analyzerResults);
}

// Cargar productos recomendados basado en análisis
function loadRecommendedProducts(analysisResults) {
  const grid = document.getElementById('recommendationsGrid');

  // Placeholders de productos recomendados
  const recommendedProducts = [
    {
      name: "Hydrating Toner",
      brand: "Beauty of Joseon",
      price: 21.42,
      image: "https://via.placeholder.com/200x200?text=Toner"
    },
    {
      name: "Snail Mucin Essence",
      brand: "Medicube",
      price: 22.09,
      image: "https://via.placeholder.com/200x200?text=Essence"
    },
    {
      name: "Centella Ampoule",
      brand: "Torriden",
      price: 16.13,
      image: "https://via.placeholder.com/200x200?text=Ampoule"
    },
    {
      name: "Vitamin C Serum",
      brand: "Round Lab",
      price: 14.38,
      image: "https://via.placeholder.com/200x200?text=Serum"
    },
    {
      name: "Moisturizing Cream",
      brand: "Mixsoon",
      price: 19.50,
      image: "https://via.placeholder.com/200x200?text=Cream"
    }
  ];

  grid.innerHTML = recommendedProducts.map(product => `
    <div class="product-recommendation">
      <img src="${product.image}" alt="${product.name}">
      <div class="info">
        <div class="name">${product.name}</div>
        <div class="price">u$s ${product.price.toFixed(2)}</div>
        <button class="btn-small" onclick="addToCart('${product.brand}-${product.name}', '${product.name}', ${product.price})">
          Agregar al carrito
        </button>
      </div>
    </div>
  `).join('');

  // Actualizar el subtítulo con el tipo de piel
  const subtitle = document.getElementById('recommendationSubtitle');
  if (subtitle) {
    subtitle.textContent = `Recomendado para tu piel ${analysisResults.skinType}`;
  }
}
