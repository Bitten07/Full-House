const express = require('express');
const router = express.Router();
const autenticarToken = require('../middlewares/autenticarToken');
const personagensController = require('../controllers/personagens.controller');

router.post('/personagens', autenticarToken, personagensController.criar);
router.get('/personagens', autenticarToken, personagensController.listar);
router.get('/personagens/:id', autenticarToken, personagensController.buscarPorId);
router.put('/personagens/:id', autenticarToken, personagensController.editar);
router.delete('/personagens/:id', autenticarToken, personagensController.deletar);

module.exports = router;