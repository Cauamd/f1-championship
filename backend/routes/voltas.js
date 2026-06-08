// routes/voltas.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/voltasController');

router.get('/', ctrl.listar);
router.post('/', ctrl.registrar);
router.get('/:competidorId', ctrl.listarPorCompetidor);

module.exports = router;
