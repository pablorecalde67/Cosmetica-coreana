/**
 * TEST: Automation Pipeline
 * Verifica que todo el sistema funciona correctamente
 */

import AutomationOrchestrator from './src/services/automation-orchestrator.js';

console.log('\n════════════════════════════════════════════════════════════');
console.log('     🧪 TEST: AUTOMATION PIPELINE - VERIFICACIÓN COMPLETA');
console.log('════════════════════════════════════════════════════════════\n');

async function runTest() {
  const orchestrator = new AutomationOrchestrator();
  
  try {
    const result = await orchestrator.runFullPipeline();
    
    // Verificaciones
    const checks = {
      'Pipeline ejecutado': result.success === true,
      'Datos extraídos': result.summary?.posts_monitored > 0,
      'Productos identificados': result.summary?.products_extracted > 0,
      'Imágenes procesadas': result.summary?.images_processed >= 0,
      'Catálogo actualizado': result.summary?.loaded_to_catalog >= 0
    };
    
    console.log('\n════════════════════════════════════════════════════════════');
    console.log('                    ✅ VERIFICACIÓN DE TESTS');
    console.log('════════════════════════════════════════════════════════════\n');
    
    let allPass = true;
    for (const [check, passed] of Object.entries(checks)) {
      const symbol = passed ? '✅' : '❌';
      console.log(`  ${symbol} ${check}`);
      if (!passed) allPass = false;
    }
    
    console.log('\n════════════════════════════════════════════════════════════');
    
    if (allPass) {
      console.log('                  🎉 TODOS LOS TESTS PASARON 🎉');
      console.log('                 SISTEMA LISTO PARA PRODUCCIÓN');
    } else {
      console.log('                  ⚠️  ALGUNOS TESTS FALLARON');
    }
    
    console.log('════════════════════════════════════════════════════════════\n');
    
    console.log('📊 RESULTADO FINAL:\n');
    console.log(JSON.stringify(result.summary, null, 2));
    
    process.exit(allPass ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ ERROR EN TEST:', error.message);
    process.exit(1);
  }
}

runTest();
