// COCA K-BEAUTY - YouTube Videos Integration
// Buscar y mostrar automáticamente videos de K-Beauty

async function loadYouTubeVideos() {
  console.log('🎬 Buscando videos de YouTube...');
  
  // Usar YouTube Data API v3
  const query = CONFIG.youtube.searchQuery;
  const apiKey = CONFIG.youtube.apiKey;
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?q=${encodeURIComponent(query)}&type=video&maxResults=${CONFIG.youtube.maxResults}&key=${apiKey}`
    );
    
    if (!response.ok) {
      console.warn('⚠️ No se pudieron cargar videos de YouTube');
      return;
    }
    
    const data = await response.json();
    const videos = data.items || [];
    
    const carousel = document.getElementById('videosCarousel');
    carousel.innerHTML = videos.map(video => `
      <div class="video-card">
        <a href="https://youtube.com/watch?v=${video.id.videoId}" target="_blank">
          <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}">
          <div class="content">
            <h3>${video.snippet.title}</h3>
            <p>${video.snippet.channelTitle}</p>
          </div>
        </a>
      </div>
    `).join('');
    
    console.log('✅ Videos cargados:', videos.length);
  } catch (error) {
    console.error('❌ Error cargando videos:', error);
  }
}
