const supabase = require('../supabase');

// POST /personagens
async function criar(req, res) {
    try {
        const { nome, sistema, dados } = req.body;
        const usuario_id = req.usuario.id; // vem do token, nunca do body

        if (!nome || !sistema) {
            return res.status(400).json({
                message: 'Nome e sistema são obrigatórios!'
            });
        }

        const { data, error } = await supabase
            .from('personagens')
            .insert({
                usuario_id,
                nome,
                sistema,
                dados: dados || {}
            })
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                message: 'Erro ao criar personagem!',
                error
            });
        }

        return res.status(201).json({
            message: 'Personagem criado!',
            personagem: data
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Erro inesperado ao criar personagem!',
            error: error.message
        });
    }
}

// GET /personagens
async function listar(req, res) {
    try {
        const usuario_id = req.usuario.id;

        const { data, error } = await supabase
            .from('personagens')
            .select('id, nome, sistema, created_at, updated_at')
            .eq('usuario_id', usuario_id)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({
                message: 'Erro ao listar personagens!',
                error
            });
        }

        return res.status(200).json({ personagens: data });

    } catch (error) {
        return res.status(500).json({
            message: 'Erro inesperado ao listar personagens!',
            error: error.message
        });
    }
}

// GET /personagens/:id
async function buscarPorId(req, res) {
    try {
        const usuario_id = req.usuario.id;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('personagens')
            .select()
            .eq('id', id)
            .eq('usuario_id', usuario_id) // segurança: garante que é dono
            .single();

        if (error || !data) {
            return res.status(404).json({
                message: 'Personagem não encontrado!'
            });
        }

        return res.status(200).json({ personagem: data });

    } catch (error) {
        return res.status(500).json({
            message: 'Erro inesperado ao buscar personagem!',
            error: error.message
        });
    }
}

// PUT /personagens/:id
async function editar(req, res) {
    try {
        const usuario_id = req.usuario.id;
        const { id } = req.params;
        const { nome, sistema, dados } = req.body;

        if (!nome && !sistema && !dados) {
            return res.status(400).json({
                message: 'Envie ao menos um campo para atualizar!'
            });
        }

        // Monta só os campos que foram enviados
        const atualizacoes = {};
        if (nome) atualizacoes.nome = nome;
        if (sistema) atualizacoes.sistema = sistema;
        if (dados) atualizacoes.dados = dados;
        atualizacoes.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('personagens')
            .update(atualizacoes)
            .eq('id', id)
            .eq('usuario_id', usuario_id) // segurança: garante que é dono
            .select()
            .single();

        if (error || !data) {
            return res.status(404).json({
                message: 'Personagem não encontrado ou sem permissão!'
            });
        }

        return res.status(200).json({
            message: 'Personagem atualizado!',
            personagem: data
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Erro inesperado ao editar personagem!',
            error: error.message
        });
    }
}

// DELETE /personagens/:id
async function deletar(req, res) {
    try {
        const usuario_id = req.usuario.id;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('personagens')
            .delete()
            .eq('id', id)
            .eq('usuario_id', usuario_id) // segurança: garante que é dono
            .select()
            .single();

        if (error || !data) {
            return res.status(404).json({
                message: 'Personagem não encontrado ou sem permissão!'
            });
        }

        return res.status(200).json({
            message: 'Personagem deletado!'
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Erro inesperado ao deletar personagem!',
            error: error.message
        });
    }
}

module.exports = { criar, listar, buscarPorId, editar, deletar };