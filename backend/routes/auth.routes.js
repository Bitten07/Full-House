const express = require('express');
const router = express.Router();
const autenticarToken = require('../middlewares/autenticarToken');
const authController = require('../controllers/auth.controller');

router.post('/cadastro', authController.cadastro);
router.post('/login', authController.login);
router.get('/me', autenticarToken, authController.me);

module.exports = router;