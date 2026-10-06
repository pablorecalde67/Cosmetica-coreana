import express from 'express';
import cors from 'cors';
import { TIENDAS } from './tiendas.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all tiendas
app.get('/api/tiendas', (req, res) => {
  res.json({
    success: true,
    count: TIENDAS.length,
    data: TIENDAS
  });
});

// Get tiendas count
app.get('/api/tiendas/count', (req, res) => {
  res.json({
    success: true,
    count: TIENDAS.length
  });
});

// Get single tienda by ID
app.get('/api/tiendas/:id', (req, res) => {
  const tienda = TIENDAS.find(t => t.id === parseInt(req.params.id));
  if (!tienda) {
    return res.status(404).json({ success: false, error: 'Tienda not found' });
  }
  res.json({ success: true, data: tienda });
});

// Search tiendas by name
app.get('/api/tiendas/search/:query', (req, res) => {
  const query = req.params.query.toLowerCase();
  const results = TIENDAS.filter(t =>
    t.nombre.toLowerCase().includes(query) ||
    t.categoria.toLowerCase().includes(query)
  );
  res.json({
    success: true,
    query,
    count: results.length,
    data: results
  });
});

// Get tiendas by category
app.get('/api/categorias/:categoria', (req, res) => {
  const categoria = req.params.categoria.toLowerCase();
  const results = TIENDAS.filter(t =>
    t.categoria.toLowerCase().includes(categoria)
  );
  res.json({
    success: true,
    categoria: req.params.categoria,
    count: results.length,
    data: results
  });
});

app.listen(PORT, () => {
  console.log(`✅ K-Beauty CDE API running on port ${PORT}`);
  console.log(`📚 Total tiendas: ${TIENDAS.length}`);
  console.log(`🔗 GET /api/tiendas - Obtener todas las tiendas`);
  console.log(`🔗 GET /api/tiendas/:id - Obtener tienda por ID`);
  console.log(`🔗 GET /api/tiendas/search/:query - Buscar tiendas`);
});
