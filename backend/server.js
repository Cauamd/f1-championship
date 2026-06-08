// server.js - Servidor principal da API F1 Championship
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// ============ MIDDLEWARES ============
app.use(cors({
  origin: '*', // Em produção, especificar o domínio
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ============ ROTAS ============
app.use('/competidores', require('./routes/competidores'));
app.use('/voltas', require('./routes/voltas'));
app.use('/ranking', require('./routes/ranking'));
app.use('/grid', require('./routes/grid'));

// Rota raiz — informações da API
app.get('/', (req, res) => {
  res.json({
    name: '🏎️ F1 Championship API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      competidores: '/competidores',
      voltas: '/voltas',
      ranking: '/ranking',
      grid: '/grid'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Handler 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

// Handler de erros globais
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ success: false, message: 'Erro interno do servidor', error: err.message });
});

// ============ INICIALIZAÇÃO ============
async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log('\n🏎️  F1 Championship API iniciada!');
      console.log(`📡 Servidor rodando em: http://localhost:${PORT}`);
      console.log(`📊 Endpoints disponíveis:`);
      console.log(`   GET  http://localhost:${PORT}/competidores`);
      console.log(`   GET  http://localhost:${PORT}/ranking`);
      console.log(`   GET  http://localhost:${PORT}/grid`);
      console.log(`   GET  http://localhost:${PORT}/voltas`);
      console.log('\n✅ API pronta para receber requisições!\n');
    });
  } catch (error) {
    console.error('❌ Falha ao iniciar servidor:', error.message);
    process.exit(1);
  }
}

start();
