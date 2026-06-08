// controllers/gridController.js
const { pool } = require('../config/database');

// GET /grid - Listar grid de largada com dados dos pilotos
const listar = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT g.*, c.nome, c.equipe, c.numero_carro, c.nacionalidade
      FROM grid_largada g
      JOIN competidores c ON g.competidor_id = c.id
      ORDER BY g.posicao ASC
    `);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao listar grid', error: error.message });
  }
};

// POST /grid - Salvar grid completo (substitui o anterior)
const salvar = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { grid } = req.body; // Array de { competidor_id, posicao }
    if (!grid || !Array.isArray(grid) || grid.length === 0) {
      return res.status(400).json({ success: false, message: 'Grid inválido' });
    }

    await conn.beginTransaction();

    // Remove grid anterior
    await conn.query('DELETE FROM grid_largada');

    // Insere novo grid
    for (const item of grid) {
      await conn.query(
        'INSERT INTO grid_largada (competidor_id, posicao) VALUES (?, ?)',
        [item.competidor_id, item.posicao]
      );
    }

    await conn.commit();

    // Retorna grid atualizado
    const [novo] = await conn.query(`
      SELECT g.*, c.nome, c.equipe, c.numero_carro, c.nacionalidade
      FROM grid_largada g
      JOIN competidores c ON g.competidor_id = c.id
      ORDER BY g.posicao ASC
    `);

    res.json({ success: true, message: 'Grid salvo com sucesso!', data: novo });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'Erro ao salvar grid', error: error.message });
  } finally {
    conn.release();
  }
};

// PUT /grid/:id - Atualizar posição específica
const atualizarPosicao = async (req, res) => {
  try {
    const { posicao } = req.body;
    const { id } = req.params;

    const [existente] = await pool.query('SELECT * FROM grid_largada WHERE id = ?', [id]);
    if (existente.length === 0) return res.status(404).json({ success: false, message: 'Entrada do grid não encontrada' });

    await pool.query('UPDATE grid_largada SET posicao = ? WHERE id = ?', [posicao, id]);
    res.json({ success: true, message: 'Posição atualizada!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar posição', error: error.message });
  }
};

module.exports = { listar, salvar, atualizarPosicao };
