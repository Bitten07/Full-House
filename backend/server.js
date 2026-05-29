// declação de dependências e configuração
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const PORT = 3000;
let usuarios = [];

app.use(express.json());

// Rota de teste para verificar se o servidor está funcionando
app.get('/', (req, res) => {
    res.json({ message: 'API do RPG plataform funcionando!' });
});

// Rota de cadastro de usuário
app.post('/cadastro', async (req, res) => {
    const { nome, email, senha} = req.body;

    if (usuarios.find(usuario => usuario.email === email)) {
        return res.status(400).json({ message: 'Email já cadastrado!' });
    } else {
        const hash = await bcrypt.hash(senha, 10);
        usuarios.push({ nome, email, senha: hash });
        console.log('Usuário cadastrado: ', nome, email);
        res.json({ message: 'Cadastro recebido com sucesso!'});
    }


})

// Rota de login de usuário
app.post('/login', async (req, res) => {
    const {email, senha} = req.body;
    const usuarioLogado = usuarios.find(usuario => usuario.email === email);

    if (!usuarioLogado) {
        return res.status(400).json({ message: 'Email não encontrado!'});
    } else {
        const senhaValida = await bcrypt.compare(senha, usuarioLogado.senha);
        if (senhaValida) {
            console.log('Usuário logado: ', usuarioLogado.nome, usuarioLogado.email);
            res.json({ message: 'Login bem-sucedido!'});
        } else {
            res.status(400).json({ message: 'Senha incorreta!'});
        }
    }
})

// Ligar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
})

