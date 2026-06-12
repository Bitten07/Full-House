// declação de dependências e configuração
require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const supabase = require('./supabase');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

if(!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não definido no .env');
}

// Middleware de autenticação
function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido!'});
    }

    try {
        const usuarioDecodificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = usuarioDecodificado;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Token de autenticação inválido!'});
    }
}

// Rota de teste
app.get('/', (req, res) => {
    res.json({ message: 'API do Full House funcionando!' });
});

// Rota de cadastro
app.post('/cadastro', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                message: 'Nome, email e senha são obrigatórios!'
            });
        }

        const hash = await bcrypt.hash(senha, 10);

        const { data, error } = await supabase
            .from('usuarios')
            .insert({ nome, email, senha: hash })
            .select('id, nome, email')
            .single();

        if (error) {
            return res.status(500).json({
                message: 'Erro ao cadastrar usuário!',
                error
            });
        }

        return res.status(201).json({
            message: 'Usuário cadastrado!',
            usuario: data
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Erro inesperado no cadastro!',
            error: error.message
        });
    }
});

// Rota de login
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                message: 'Email e senha são obrigatórios!'
            });
        }

        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (error || !usuario) {
            return res.status(401).json({
                message: 'Email ou senha inválidos!'
            });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({
                message: 'Email ou senha inválidos!'
            });
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: 'Login bem-sucedido!',
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Erro inesperado no login!',
            error: error.message
        });
    }
});

// Primeira rota protegida
app.get('/me', autenticarToken, async (req, res) => {
    const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .eq('id', req.usuario.id)
        .single();

    if (error || !usuario) {
        return res.status(404).json({
            message: 'Usuário não encontrado!'
        });
    }

    return res.status(200).json({ usuario });
});

// Ligar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});