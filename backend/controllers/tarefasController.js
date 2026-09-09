// Importa a conexão com o banco de dados MySQL
const conexao = require("../config/database");


// ============================================================
// BUSCAR TAREFAS DO USUÁRIO
// ============================================================

// Função responsável por buscar as tarefas do usuário autenticado
function buscarTarefas(req, res) {

    // Pega o ID do usuário que foi identificado pelo JWT
    const usuarioId = req.usuario.id;

    // Busca somente as tarefas pertencentes ao usuário logado
    const sql = `
        SELECT
            id,
            titulo,
            data,
            importancia,
            descricao,
            concluida,
            fixada,
            criada_em
        FROM tarefas
        WHERE usuario_id = ?
        ORDER BY data ASC
    `;

    // Executa a consulta no banco de dados
    conexao.query(sql, [usuarioId], (erro, resultados) => {

        // Verifica se aconteceu algum erro
        if (erro) {

            // Mostra o erro no terminal do servidor
            console.error("Erro ao buscar tarefas:", erro.message);

            // Envia uma resposta de erro para o cliente
            return res.status(500).json({
                erro: "Erro ao buscar tarefas"
            });
        }

        // Envia as tarefas encontradas como resposta JSON
        res.json(resultados);
    });
}


// ============================================================
// CRIAR TAREFA
// ============================================================

// Função responsável por criar uma nova tarefa
function criarTarefa(req, res) {

    // Pega o ID do usuário autenticado através do JWT
    const usuarioId = req.usuario.id;

    // Pega os dados enviados pelo cliente
    const {
        titulo,
        data,
        importancia,
        descricao,
        concluida,
        fixada
    } = req.body;

    // Verifica se o título e a data foram preenchidos
    if (!titulo || !data) {

        // Interrompe a execução e informa o problema
        return res.status(400).json({
            erro: "Título e data são obrigatórios"
        });
    }

    // Comando SQL utilizado para criar a tarefa
    const sql = `
        INSERT INTO tarefas (
            usuario_id,
            titulo,
            data,
            importancia,
            descricao,
            concluida,
            fixada
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // Executa o comando no banco de dados
    conexao.query(
        sql,
        [
            usuarioId,
            titulo,
            data,
            importancia || "media",
            descricao || null,
            concluida || false,
            fixada || false
        ],
        (erro, resultado) => {

            // Verifica se aconteceu algum erro
            if (erro) {

                // Mostra o erro no terminal
                console.error("Erro ao criar tarefa:", erro.message);

                // Envia uma resposta de erro para o cliente
                return res.status(500).json({
                    erro: "Erro ao criar tarefa"
                });
            }

            // Informa que a tarefa foi criada
            res.status(201).json({
                mensagem: "Tarefa criada com sucesso!",

                // Retorna o ID gerado pelo MySQL
                id: resultado.insertId
            });
        }
    );
}


// ============================================================
// ATUALIZAR TAREFA
// ============================================================

// Função responsável por atualizar uma tarefa do usuário autenticado
function atualizarTarefa(req, res) {

    // Pega o ID do usuário identificado pelo JWT
    const usuarioId = req.usuario.id;

    // Pega o ID da tarefa enviado pela URL
    const tarefaId = req.params.id;

    // Pega os novos dados enviados pelo cliente
    const {
        titulo,
        data,
        importancia,
        descricao,
        concluida,
        fixada
    } = req.body;

    // Verifica se o título e a data foram preenchidos
    if (!titulo || !data) {

        // Interrompe a execução e informa o problema
        return res.status(400).json({
            erro: "Título e data são obrigatórios"
        });
    }

    // Comando SQL utilizado para atualizar a tarefa
    const sql = `
        UPDATE tarefas
        SET
            titulo = ?,
            data = ?,
            importancia = ?,
            descricao = ?,
            concluida = ?,
            fixada = ?
        WHERE id = ?
        AND usuario_id = ?
    `;

    // Executa a atualização no banco de dados
    conexao.query(
        sql,
        [
            titulo,
            data,
            importancia || "media",
            descricao || null,
            concluida || false,
            fixada || false,
            tarefaId,
            usuarioId
        ],
        (erro, resultado) => {

            // Verifica se aconteceu algum erro
            if (erro) {

                // Mostra o erro no terminal
                console.error("Erro ao atualizar tarefa:", erro.message);

                // Envia uma resposta de erro para o cliente
                return res.status(500).json({
                    erro: "Erro ao atualizar tarefa"
                });
            }

            // Verifica se nenhuma tarefa foi encontrada
            if (resultado.affectedRows === 0) {

                // Impede que um usuário atualize
                // uma tarefa pertencente a outro usuário
                return res.status(404).json({
                    erro: "Tarefa não encontrada"
                });
            }

            // Informa que a tarefa foi atualizada
            res.json({
                mensagem: "Tarefa atualizada com sucesso!"
            });
        }
    );
}


// ============================================================
// EXCLUIR TAREFA
// ============================================================

// Função responsável por excluir uma tarefa do usuário autenticado
function excluirTarefa(req, res) {

    // Pega o ID do usuário identificado pelo JWT
    const usuarioId = req.usuario.id;

    // Pega o ID da tarefa enviado pela URL
    const tarefaId = req.params.id;

    // Comando SQL utilizado para excluir a tarefa
    const sql = `
        DELETE FROM tarefas
        WHERE id = ?
        AND usuario_id = ?
    `;

    // Executa a exclusão no banco de dados
    conexao.query(
        sql,
        [tarefaId, usuarioId],
        (erro, resultado) => {

            // Verifica se aconteceu algum erro
            if (erro) {

                // Mostra o erro no terminal
                console.error("Erro ao excluir tarefa:", erro.message);

                // Envia uma resposta de erro para o cliente
                return res.status(500).json({
                    erro: "Erro ao excluir tarefa"
                });
            }

            // Verifica se nenhuma tarefa foi encontrada
            if (resultado.affectedRows === 0) {

                // Impede que o usuário tente excluir
                // uma tarefa que não pertence a ele
                return res.status(404).json({
                    erro: "Tarefa não encontrada"
                });
            }

            // Informa que a tarefa foi excluída
            res.json({
                mensagem: "Tarefa excluída com sucesso!"
            });
        }
    );
}


// ============================================================
// EXPORTAÇÃO
// ============================================================

// Exporta as funções para serem utilizadas pelas rotas
module.exports = {
    buscarTarefas,
    criarTarefa,
    atualizarTarefa,
    excluirTarefa
};