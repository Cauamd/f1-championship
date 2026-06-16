-- ============================================
-- F1 Championship - Schema do Banco de Dados
-- ============================================

CREATE DATABASE IF NOT EXISTS f1_championship
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE f1_championship;

-- Tabela de Competidores
CREATE TABLE IF NOT EXISTS competidores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    equipe VARCHAR(255) NOT NULL,
    numero_carro INT NOT NULL,
    nacionalidade VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Voltas
CREATE TABLE IF NOT EXISTS voltas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    competidor_id INT NOT NULL,
    tempo_volta DECIMAL(10,3),
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (competidor_id) REFERENCES competidores(id) ON DELETE CASCADE
);

-- Tabela de Grid de Largada
CREATE TABLE IF NOT EXISTS grid_largada (
    id INT AUTO_INCREMENT PRIMARY KEY,
    competidor_id INT NOT NULL,
    posicao INT NOT NULL,
    FOREIGN KEY (competidor_id) REFERENCES competidores(id) ON DELETE CASCADE
<<<<<<< HEAD
);
=======
);
>>>>>>> 3a06383f2ceb6f43e388d2b8aa7fe0d78fbf0910
