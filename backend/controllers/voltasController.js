// controllers/voltasController.js
const { pool } = require('../config/database');

// GET /voltas - Listar todas as voltas com dados do competidor
const listar = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT v.*, c.nome, c.equipe, c.numero_carro
      FROM voltas v
      JOIN competidores c ON v.competidor_id = c.id
      ORDER BY v.data_hora DESC
    `);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao listar voltas', error: error.message });
  }
};

// GET /voltas/:competidorId - Voltas de um competidor específico
const listarPorCompetidor = async (req, res) => {
  try {
    const { competidorId } = req.params;

    // Verifica se competidor existe
    const [comp] = await pool.query('SELECT * FROM competidores WHERE id = ?', [competidorId]);
    if (comp.length === 0) return res.status(404).json({ success: false, message: 'Competidor não encontrado' });

    const [voltas] = await pool.query(
      'SELECT * FROM voltas WHERE competidor_id = ? ORDER BY data_hora DESC',
      [competidorId]
    );

    // Calcula estatísticas
    const tempos = voltas.map(v => parseFloat(v.tempo_volta));
    const stats = tempos.length > 0 ? {
      melhor_volta: Math.min(...tempos).toFixed(3),
      ultima_volta: tempos[0].toFixed(3),
      media: (tempos.reduce((a, b) => a + b, 0) / tempos.length).toFixed(3),
      total_voltas: tempos.length
    } : null;

    res.json({
      success: true,
      competidor: comp[0],
      data: voltas,
      stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar voltas', error: error.message });
  }
};

// POST /voltas - Registrar nova volta
const registrar = async (req, res) => {
  try {
    const { competidor_id, tempo_volta } = req.body;
    if (!competidor_id || !tempo_volta) {
      return res.status(400).json({ success: false, message: 'Competidor e tempo de volta são obrigatórios' });
    }

    if (tempo_volta <= 0) {
      return res.status(400).json({ success: false, message: 'Tempo de volta deve ser positivo' });
    }

    // Verifica se competidor existe
    const [comp] = await pool.query('SELECT * FROM competidores WHERE id = ?', [competidor_id]);
    if (comp.length === 0) return res.status(404).json({ success: false, message: 'Competidor não encontrado' });

    const [result] = await pool.query(
      'INSERT INTO voltas (competidor_id, tempo_volta) VALUES (?, ?)',
      [competidor_id, parseFloat(tempo_volta)]
    );

    const [nova] = await pool.query(`
      SELECT v.*, c.nome, c.equipe, c.numero_carro
      FROM voltas v JOIN competidores c ON v.competidor_id = c.id
      WHERE v.id = ?
    `, [result.insertId]);

    res.status(201).json({ success: true, message: 'Volta registrada com sucesso!', data: nova[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao registrar volta', error: error.message });
  }
};

module.exports = { listar, listarPorCompetidor, registrar };
