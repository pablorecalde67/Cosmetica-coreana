// COCA K-BEAUTY - Firebase Integration
// Inicializar Firebase y configurar base de datos

let firebaseApp = null;
let database = null;

// Inicializar Firebase
function initializeFirebase() {
  try {
    firebaseApp = firebase.initializeApp(CONFIG.firebase);
    database = firebase.database();
    console.log('✅ Firebase inicializado');
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
  }
}

// Guardar orden en Firebase
async function saveOrder(orderData) {
  if (!database) {
    console.error('Firebase no está inicializado');
    return null;
  }

  try {
    const ordersRef = database.ref('orders');
    const newOrderRef = ordersRef.push();
    
    await newOrderRef.set({
      ...orderData,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      status: 'pending'
    });
    
    console.log('✅ Orden guardada:', newOrderRef.key);
    return newOrderRef.key;
  } catch (error) {
    console.error('❌ Error guardando orden:', error);
    return null;
  }
}

// Obtener órdenes del usuario
async function getUserOrders(userId) {
  if (!database) return [];

  try {
    const snapshot = await database.ref('orders').orderByChild('userId').equalTo(userId).once('value');
    return snapshot.val() || {};
  } catch (error) {
    console.error('❌ Error obteniendo órdenes:', error);
    return {};
  }
}

// Actualizar estado de orden
async function updateOrderStatus(orderId, status) {
  if (!database) return false;

  try {
    await database.ref(`orders/${orderId}`).update({ status });
    console.log('✅ Orden actualizada:', orderId, status);
    return true;
  } catch (error) {
    console.error('❌ Error actualizando orden:', error);
    return false;
  }
}

// Escuchar cambios en tiempo real
function subscribeToOrders(userId, callback) {
  if (!database) return;

  database.ref('orders').orderByChild('userId').equalTo(userId).on('value', (snapshot) => {
    callback(snapshot.val() || {});
  });
}

// Inicializar al cargar
window.addEventListener('load', initializeFirebase);
