// routes/ranking.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/rankingController');
router.get('/', ctrl.getRanking);
module.exports = router;
