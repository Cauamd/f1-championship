// controllers/competidoresController.js
const { pool } = require('../config/database');

// GET /competidores - Listar todos os competidores
const listar = async (req, res) => {
  try {
    const { busca } = req.query;
    let sql = 'SELECT * FROM competidores';
    let params = [];

    if (busca) {
      sql += ' WHERE nome LIKE ? OR equipe LIKE ?';
      params = [`%${busca}%`, `%${busca}%`];
    }

    sql += ' ORDER BY numero_carro ASC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao listar competidores', error: error.message });
  }
};

// GET /competidores/:id - Buscar por ID
const buscarPorId = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM competidores WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Competidor não encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao buscar competidor', error: error.message });
  }
};

// POST /competidores - Criar novo competidor
const criar = async (req, res) => {
  try {
    const { nome, equipe, numero_carro, nacionalidade, foto } = req.body;
    if (!nome || !equipe || !numero_carro) {
      return res.status(400).json({ success: false, message: 'Nome, equipe e número do carro são obrigatórios' });
    }

    // Verifica se número do carro já existe
    const [existente] = await pool.query('SELECT id FROM competidores WHERE numero_carro = ?', [numero_carro]);
    if (existente.length > 0) {
      return res.status(400).json({ success: false, message: `Número de carro ${numero_carro} já está em uso` });
    }

    const [result] = await pool.query(
      'INSERT INTO competidores (nome, equipe, numero_carro, nacionalidade, foto) VALUES (?, ?, ?, ?, ?)',
      [nome, equipe, numero_carro, nacionalidade || null, foto || null]
    );

    const [novo] = await pool.query('SELECT * FROM competidores WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Competidor criado com sucesso!', data: novo[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao criar competidor', error: error.message });
  }
};

// PUT /competidores/:id - Atualizar competidor
const atualizar = async (req, res) => {
  try {
    const { nome, equipe, numero_carro, nacionalidade, foto } = req.body;
    const { id } = req.params;

    const [existente] = await pool.query('SELECT id FROM competidores WHERE id = ?', [id]);
    if (existente.length === 0) return res.status(404).json({ success: false, message: 'Competidor não encontrado' });

    // Verifica conflito de número de carro com outro competidor
    if (numero_carro) {
      const [conflito] = await pool.query('SELECT id FROM competidores WHERE numero_carro = ? AND id != ?', [numero_carro, id]);
      if (conflito.length > 0) {
        return res.status(400).json({ success: false, message: `Número de carro ${numero_carro} já está em uso` });
      }
    }

    await pool.query(
      'UPDATE competidores SET nome = ?, equipe = ?, numero_carro = ?, nacionalidade = ?, foto = ? WHERE id = ?',
      [nome, equipe, numero_carro, nacionalidade || null, foto || null, id]
    );

    const [atualizado] = await pool.query('SELECT * FROM competidores WHERE id = ?', [id]);
    res.json({ success: true, message: 'Competidor atualizado com sucesso!', data: atualizado[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar competidor', error: error.message });
  }
};

// DELETE /competidores/:id - Excluir competidor
const excluir = async (req, res) => {
  try {
    const [existente] = await pool.query('SELECT * FROM competidores WHERE id = ?', [req.params.id]);
    if (existente.length === 0) return res.status(404).json({ success: false, message: 'Competidor não encontrado' });

    await pool.query('DELETE FROM competidores WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: `Competidor "${existente[0].nome}" excluído com sucesso!` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao excluir competidor', error: error.message });
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
