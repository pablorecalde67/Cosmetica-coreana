/**
 * AUTOMATION ORCHESTRATOR
 * Coordina el pipeline completo automático:
 * 1. Monitorea redes sociales CDE
 * 2. Procesa imágenes (remover watermarks)
 * 3. Normaliza datos
 * 4. Valida calidad
 * 5. Carga al catálogo
 * 
 * TODO AUTOMÁTICO - CERO intervención manual
 */

import SocialMediaMonitor from './social-media-monitor.js';
import ImageProcessor from './image-processor.js';
import AutoCatalogLoader from './auto-catalog-loader.js';

class AutomationOrchestrator {
  constructor() {
    this.monitor = new SocialMediaMonitor();
    this.imageProcessor = new ImageProcessor();
    this.catalogLoader = new AutoCatalogLoader();
  }

  /**
   * EJECUTAR PIPELINE COMPLETO
   */
  async runFullPipeline() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║      🤖 AUTOMATION ORCHESTRATOR - PIPELINE COMPLETO         ║');
    console.log('║                                                            ║');
    console.log('║  Fase 1: Monitorear redes sociales CDE                    ║');
    console.log('║  Fase 2: Procesar imágenes                                ║');
    console.log('║  Fase 3: Normalizar datos                                 ║');
    console.log('║  Fase 4: Validar calidad                                  ║');
    console.log('║  Fase 5: Cargar al catálogo                               ║');
    console.log('║                                                            ║');
    console.log('║         CERO intervención manual del usuario               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    try {
      // FASE 1: Monitorear redes sociales
      console.log('📲 FASE 1: MONITOREO DE REDES SOCIALES...\n');
      const socialData = await this.monitor.run();
      
      if (socialData.valid_products === 0) {
        console.log('⚠️  No se encontraron productos válidos en redes sociales');
        return {
          success: false,
          message: 'No hay datos nuevos para procesar'
        };
      }

      // FASE 2: Procesar imágenes
      console.log('\n🖼️  FASE 2: PROCESAMIENTO DE IMÁGENES...\n');
      
      const productsWithImages = [];
      for (const product of socialData.products) {
        const imageResult = await this.imageProcessor.processImage(product.image_url);
        
        if (imageResult.success) {
          product.final_image_url = imageResult.final_url;
          productsWithImages.push(product);
        }
      }
      
      console.log(`✅ ${productsWithImages.length} imágenes procesadas correctamente\n`);

      // FASE 3 & 4: Normalizar y validar (ya hecho en monitor)
      console.log('✅ FASE 3-4: NORMALIZACIÓN Y VALIDACIÓN (completado)\n');

      // FASE 5: Cargar al catálogo
      console.log('💾 FASE 5: CARGANDO AL CATÁLOGO...\n');
      
      const loadResult = await this.catalogLoader.loadProducts(productsWithImages);

      // RESUMEN FINAL
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║              ✅ PIPELINE COMPLETADO EXITOSAMENTE             ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      console.log('📊 RESUMEN EJECUTIVO:\n');
      console.log(`  • Posts monitoreados: ${socialData.total_posts}`);
      console.log(`  • Productos extraídos: ${socialData.valid_products}`);
      console.log(`  • Imágenes procesadas: ${productsWithImages.length}`);
      console.log(`  • Cargados al catálogo: ${loadResult.loaded}`);
      console.log(`  • Rechazados: ${loadResult.rejected}`);
      console.log(`  • Tasa éxito: ${((loadResult.loaded / loadResult.total) * 100).toFixed(1)}%\n`);

      console.log('💰 IMPACTO ECONÓMICO:\n');
      const totalValue = productsWithImages.reduce((sum, p) => sum + p.price_final, 0);
      const markup = productsWithImages.reduce((sum, p) => sum + (p.price_final - p.price_cde), 0);
      
      console.log(`  • Valor total productos: $${totalValue.toFixed(2)}`);
      console.log(`  • Margen generado (30%): $${markup.toFixed(2)}`);
      console.log(`  • Promedio por producto: $${(markup / loadResult.loaded).toFixed(2)}\n`);

      console.log('🔄 PRÓXIMA EJECUCIÓN:\n');
      console.log('  ⏰ En 6 horas (o cuando se dispare manualmente)\n');

      return {
        success: true,
        summary: {
          posts_monitored: socialData.total_posts,
          products_extracted: socialData.valid_products,
          images_processed: productsWithImages.length,
          loaded_to_catalog: loadResult.loaded,
          rejected: loadResult.rejected,
          success_rate: ((loadResult.loaded / loadResult.total) * 100).toFixed(1),
          total_value: totalValue.toFixed(2),
          markup_generated: markup.toFixed(2)
        }
      };

    } catch (error) {
      console.error('\n❌ ERROR EN PIPELINE:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Ejecutar como cron job automático
   * Se ejecuta cada 6 horas sin intervención
   */
  async startAutomatedSchedule() {
    const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 horas
    
    console.log('🕐 INICIANDO MONITOR AUTOMÁTICO (cada 6 horas)\n');
    
    // Ejecutar inmediatamente
    await this.runFullPipeline();
    
    // Luego cada 6 horas
    setInterval(async () => {
      console.log('\n[CRON] Ejecutando ciclo automático de monitoreo...');
      await this.runFullPipeline();
    }, INTERVAL_MS);
  }
}

export default AutomationOrchestrator;
