# 🏎️ F1 Championship — Plataforma de Competição

Sistema web completo para gerenciamento de competições de Fórmula 1, com Frontend, Backend Node.js e API REST.

---

## 🚀 Como Executar

### Pré-requisitos
- **Node.js** v16+
- **MySQL** 5.7+ ou 8.0+

---

### 1. Banco de Dados

Configure o MySQL e crie o banco (o sistema cria as tabelas automaticamente ao iniciar).

Opcional — rode o SQL de exemplo:
```bash
mysql -u root -p < database/schema.sql
```

---

### 2. Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Edite o arquivo .env com suas credenciais MySQL:
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=sua_senha
# DB_NAME=f1_championship
# PORT=3001

# Iniciar servidor
npm start

# Ou em modo desenvolvimento (com hot-reload)
npm run dev
```

API disponível em: `http://localhost:3001`

---

### 3. Frontend

Abra o arquivo diretamente no navegador:
```
frontend/index.html
```

Ou sirva com um servidor estático:
```bash
# Com Python
cd frontend && python3 -m http.server 8080

# Com npx
npx serve frontend
```

Acesse: `http://localhost:8080`

---

## 📡 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/competidores` | Listar pilotos (aceita ?busca=) |
| GET | `/competidores/:id` | Buscar piloto por ID |
| POST | `/competidores` | Criar piloto |
| PUT | `/competidores/:id` | Atualizar piloto |
| DELETE | `/competidores/:id` | Excluir piloto |
| GET | `/voltas` | Listar todas as voltas |
| POST | `/voltas` | Registrar volta |
| GET | `/voltas/:competidorId` | Voltas de um piloto |
| GET | `/ranking` | Ranking geral |
| GET | `/grid` | Grid de largada |
| POST | `/grid` | Salvar grid completo |
| PUT | `/grid/:id` | Atualizar posição |

---

## 📁 Estrutura do Projeto

```
f1-championship/
├── backend/
│   ├── config/
│   │   └── database.js       # Conexão e inicialização do MySQL
│   ├── controllers/
│   │   ├── competidoresController.js
│   │   ├── voltasController.js
│   │   ├── rankingController.js
│   │   └── gridController.js
│   ├── routes/
│   │   ├── competidores.js
│   │   ├── voltas.js
│   │   ├── ranking.js
│   │   └── grid.js
│   ├── server.js             # Ponto de entrada do servidor
│   ├── .env                  # Variáveis de ambiente (editar!)
│   └── package.json
├── frontend/
│   ├── css/
│   │   └── style.css         # Estilos completos com tema F1
│   ├── js/
│   │   ├── api.js            # Serviço de API + utilitários
│   │   ├── competidores.js   # Módulo CRUD de pilotos
│   │   ├── cronometragem.js  # Módulo cronômetro + voltas
│   │   └── grid-ranking.js   # Módulos de grid e ranking
│   └── index.html            # SPA principal
├── database/
│   └── schema.sql            # Script SQL completo
└── README.md
```

---

## ✨ Funcionalidades

- **🏠 Home** — Dashboard com estatísticas, contagem regressiva e pódio
- **👥 Pilotos** — CRUD completo com busca em tempo real
- **⏱️ Cronometragem** — Cronômetro ao vivo + inserção manual de tempos
- **🏁 Grid de Largada** — Drag & drop para organizar posições
- **🏆 Ranking** — Classificação automática por melhor volta

### Recursos Visuais
- Cursor personalizado de corrida
- Partículas animadas no fundo
- Speed lines de velocidade
- Tema escuro inspirado no paddock F1
- Toasts de notificação
- Modal de confirmação antes de excluir
- Animações de contadores
- Luzes de largada animadas no grid
