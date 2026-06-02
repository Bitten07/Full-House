// declação de dependências e configuração
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const PORT = 3000;
const supabase = require('./supabase');

app.use(express.json());

// Rota de teste para verificar se o servidor está funcionando
app.get('/', (req, res) => {
    res.json({ message: 'API do RPG plataform funcionando!' });
});

// Rota de cadastro de usuário
app.post('/cadastro', async (req, res) => {
    const { nome, email, senha} = req.body;
    
    const hash = await bcrypt.hash(senha, 10)
    const { data, error } = await supabase
        .from('usuarios')
        .insert({ nome, email, senha: hash })
    
    if (error) {
        res.status(500).json({ message: 'Erro ao cadastrar usupário!', error});
    } else {
        res.status(200).json({ message: 'Usuário cadastrado: ', nome, email} );
    }


})

// Rota de login de usuário
app.post('/login', async (req, res) => {
    const {email, senha} = req.body;
    const {data, error} = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

    if (error || data.length === 0) {
        res.status(401).json({ message: 'Email ou senha inválidos!'});
    } else {
        const usuario = data;
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (senhaValida) {
            res.status(200).json({ message: 'Login bem-sucedido!', usuario: { nome: usuario.nome, email: usuario.email } });
        } else {
            res.status(401).json({ message: 'Email ou senha inválidos!' });
        }
    }
})

// Ligar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
})

