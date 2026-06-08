// controllers/rankingController.js
const { pool } = require('../config/database');

// GET /ranking - Ranking geral baseado em melhor volta
const getRanking = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.id,
        c.nome,
        c.equipe,
        c.numero_carro,
        c.nacionalidade,
        MIN(v.tempo_volta) AS melhor_volta,
        AVG(v.tempo_volta) AS media_voltas,
        COUNT(v.id) AS total_voltas,
        MAX(v.data_hora) AS ultima_atividade
      FROM competidores c
      LEFT JOIN voltas v ON c.id = v.competidor_id
      GROUP BY c.id, c.nome, c.equipe, c.numero_carro, c.nacionalidade
      ORDER BY melhor_volta ASC NULLS LAST, c.nome ASC
    `);

    // Adiciona posição no ranking
    const ranking = rows.map((piloto, index) => ({
      ...piloto,
      posicao: index + 1,
      melhor_volta: piloto.melhor_volta ? parseFloat(piloto.melhor_volta).toFixed(3) : null,
      media_voltas: piloto.media_voltas ? parseFloat(piloto.media_voltas).toFixed(3) : null
    }));

    res.json({ success: true, data: ranking, total: ranking.length });
  } catch (error) {
    // Fallback sem NULLS LAST para compatibilidade MySQL
    try {
      const [rows] = await pool.query(`
        SELECT
          c.id,
          c.nome,
          c.equipe,
          c.numero_carro,
          c.nacionalidade,
          MIN(v.tempo_volta) AS melhor_volta,
          AVG(v.tempo_volta) AS media_voltas,
          COUNT(v.id) AS total_voltas
        FROM competidores c
        LEFT JOIN voltas v ON c.id = v.competidor_id
        GROUP BY c.id, c.nome, c.equipe, c.numero_carro, c.nacionalidade
        ORDER BY melhor_volta IS NULL ASC, melhor_volta ASC, c.nome ASC
      `);

      const ranking = rows.map((piloto, index) => ({
        ...piloto,
        posicao: index + 1,
        melhor_volta: piloto.melhor_volta ? parseFloat(piloto.melhor_volta).toFixed(3) : null,
        media_voltas: piloto.media_voltas ? parseFloat(piloto.media_voltas).toFixed(3) : null
      }));

      res.json({ success: true, data: ranking, total: ranking.length });
    } catch (err2) {
      res.status(500).json({ success: false, message: 'Erro ao calcular ranking', error: err2.message });
    }
  }
};

module.exports = { getRanking };
