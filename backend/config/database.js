// config/database.js - Configuração da conexão com MySQL
const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexões para melhor performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'f1_championship',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00'
});

// Inicializa o banco de dados criando as tabelas se não existirem
async function initDB() {
  try {
    const conn = await pool.getConnection();

    // Cria o banco se não existir
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'f1_championship'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${process.env.DB_NAME || 'f1_championship'}\``);

    // Cria tabela competidores
    await conn.query(`
      CREATE TABLE IF NOT EXISTS competidores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        equipe VARCHAR(255) NOT NULL,
        numero_carro INT NOT NULL,
        nacionalidade VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Cria tabela voltas
    await conn.query(`
      CREATE TABLE IF NOT EXISTS voltas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        competidor_id INT NOT NULL,
        tempo_volta DECIMAL(10,3),
        data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (competidor_id) REFERENCES competidores(id) ON DELETE CASCADE
      )
    `);

    // Cria tabela grid_largada
    await conn.query(`
      CREATE TABLE IF NOT EXISTS grid_largada (
        id INT AUTO_INCREMENT PRIMARY KEY,
        competidor_id INT NOT NULL,
        posicao INT NOT NULL,
        FOREIGN KEY (competidor_id) REFERENCES competidores(id) ON DELETE CASCADE
      )
    `);

    conn.release();
    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
    throw error;
  }
}

module.exports = { pool, initDB };
