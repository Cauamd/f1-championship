// routes/grid.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/gridController');

router.get('/', ctrl.listar);
router.post('/', ctrl.salvar);
router.put('/:id', ctrl.atualizarPosicao);

module.exports = router;
