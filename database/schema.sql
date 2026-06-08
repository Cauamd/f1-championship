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
);

-- Dados iniciais de exemplo
INSERT INTO competidores (nome, equipe, numero_carro, nacionalidade) VALUES
('Max Verstappen', 'Red Bull Racing', 1, 'Holandês'),
('Lewis Hamilton', 'Ferrari', 44, 'Britânico'),
('Charles Leclerc', 'Ferrari', 16, 'Monegasco'),
('Lando Norris', 'McLaren', 4, 'Britânico'),
('Carlos Sainz', 'Williams', 55, 'Espanhol'),
('Fernando Alonso', 'Aston Martin', 14, 'Espanhol');

INSERT INTO voltas (competidor_id, tempo_volta) VALUES
(1, 90.123), (1, 89.876), (1, 88.543),
(2, 91.234), (2, 90.567), (2, 89.901),
(3, 90.876), (3, 90.234), (3, 91.100),
(4, 91.567), (4, 90.900), (4, 90.123),
(5, 92.345), (5, 91.789), (5, 91.456),
(6, 91.900), (6, 91.234), (6, 90.678);

INSERT INTO grid_largada (competidor_id, posicao) VALUES
(1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6);
