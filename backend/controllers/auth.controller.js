const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');


// Rota de cadastro
app.post('/cadastro', async (req, res) => {
    try {
        const { nome, usuario, email, senha, role, avatar } = req.body;

        if (!nome || !usuario || !email || !senha) {
            return res.status(400).json({
                message: 'Nome, usuário, email e senha são obrigatórios!'
            });
        }

        if (senha.length < 6) {
            return res.status(400).json({
                message: 'A senha precisa ter pelo menos 6 caracteres!'
            });
        }

        const roleFinal = role || 'player';

        if (!['mestre', 'player'].includes(roleFinal)) {
            return res.status(400).json({
                message: 'Role inválida. Use mestre ou player.'
            });
        }

        const usuarioFormatado = usuario
            .trim()
            .toLowerCase()
            .replace('@', '');

        if (!/^[a-z0-9._-]{3,20}$/.test(usuarioFormatado)) {
            return res.status(400).json({
                message: 'Usuário inválido. Use de 3 a 20 caracteres com letras, números, ponto, traço ou underline.'
            });
        }

        const emailFormatado = email.trim().toLowerCase();

        const hash = await bcrypt.hash(senha, 10);

        const { data, error } = await supabase
            .from('usuarios')
            .insert({
                nome,
                usuario: usuarioFormatado,
                email: emailFormatado,
                senha: hash,
                role: roleFinal,
                avatar: avatar || null
            })
            .select('id, nome, usuario, email, role, avatar, created_at')
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({
                    message: 'Email ou usuário já cadastrado!'
                });
            }

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
        const { email, usuario, identificador, senha } = req.body;

        const login = identificador || email || usuario;

        if (!login || !senha) {
            return res.status(400).json({
                message: 'Email/usuário e senha são obrigatórios!'
            });
        }

        const loginEmail = login.trim().toLowerCase();
        const loginUsuario = login.trim().toLowerCase().replace('@', '');

        const { data: usuarioEncontrado, error } = await supabase
            .from('usuarios')
            .select('*')
            .or(`email.eq.${loginEmail},usuario.eq.${loginUsuario}`)
            .maybeSingle();

        if (error || !usuarioEncontrado) {
            return res.status(401).json({
                message: 'Email/usuário ou senha inválidos!'
            });
        }

        const senhaValida = await bcrypt.compare(senha, usuarioEncontrado.senha);

        if (!senhaValida) {
            return res.status(401).json({
                message: 'Email/usuário ou senha inválidos!'
            });
        }

        const token = jwt.sign(
            {
                id: usuarioEncontrado.id,
                nome: usuarioEncontrado.nome,
                usuario: usuarioEncontrado.usuario,
                email: usuarioEncontrado.email,
                role: usuarioEncontrado.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: 'Login bem-sucedido!',
            token,
            usuario: {
                id: usuarioEncontrado.id,
                nome: usuarioEncontrado.nome,
                usuario: usuarioEncontrado.usuario,
                email: usuarioEncontrado.email,
                role: usuarioEncontrado.role,
                avatar: usuarioEncontrado.avatar
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
        .select('id, nome, usuario, email, role, avatar, created_at')
        .eq('id', req.usuario.id)
        .single();

    if (error || !usuario) {
        return res.status(404).json({
            message: 'Usuário não encontrado!'
        });
    }

    return res.status(200).json({ usuario });
});