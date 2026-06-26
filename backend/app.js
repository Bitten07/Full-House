require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const personagensRoutes = require('./routes/personagem.routes');

const app = express();

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não definido no .env');
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'API do Full House funcionando!' });
});

app.use(authRoutes);
app.use(personagensRoutes);

module.exports = app;