// Importa a conexão com o banco de dados MySQL
const conexao = require("../config/database");

// Importa o bcrypt para proteger e verificar senhas
const bcrypt = require("bcrypt");

// Importa o jsonwebtoken para criar tokens de autenticação
const jwt = require("jsonwebtoken");


// ============================================================
// BUSCAR USUÁRIOS
// ============================================================

// Função responsável por buscar todos os usuários
function buscarUsuarios(req, res) {

    // Busca somente os dados públicos dos usuários
    // A senha não é selecionada nem enviada pela API
    const sql = `
        SELECT id, nome, email
        FROM usuarios
    `;

    // Executa a consulta no banco de dados
    conexao.query(sql, (erro, resultados) => {

        // Verifica se aconteceu algum erro
        if (erro) {

            // Mostra o erro no terminal do servidor
            console.error("Erro ao buscar usuários:", erro.message);

            // Envia uma resposta de erro para o cliente
            return res.status(500).json({
                erro: "Erro ao buscar usuários"
            });
        }

        // Envia os usuários encontrados como resposta JSON
        res.json(resultados);
    });
}


// ============================================================
// BUSCAR O PRÓPRIO USUÁRIO
// ============================================================

// Função responsável por buscar os dados do usuário autenticado
function buscarMeuPerfil(req, res) {

    // Pega o ID do usuário que foi identificado pelo JWT
    const usuarioId = req.usuario.id;

    // Busca os dados desse usuário no banco
    const sql = `
        SELECT id, nome, email, criado_em
        FROM usuarios
        WHERE id = ?
    `;

    // Executa a consulta utilizando o ID do usuário
    conexao.query(sql, [usuarioId], (erro, resultados) => {

        // Verifica se aconteceu algum erro
        if (erro) {

            // Mostra o erro no terminal
            console.error("Erro ao buscar perfil:", erro.message);

            // Retorna um erro para o cliente
            return res.status(500).json({
                erro: "Erro ao buscar perfil"
            });
        }

        // Verifica se o usuário não foi encontrado
        if (resultados.length === 0) {

            // Retorna erro informando que o usuário não existe
            return res.status(404).json({
                erro: "Usuário não encontrado"
            });
        }

        // Envia os dados do próprio usuário
        // A senha não está incluída na consulta
        res.json(resultados[0]);
    });
}


// ============================================================
// EDITAR O PRÓPRIO PERFIL
// ============================================================

// Função responsável por atualizar nome e e-mail
// do usuário autenticado
function atualizarMeuPerfil(req, res) {

    // Pega o ID do usuário identificado pelo JWT
    const usuarioId = req.usuario.id;

    // Pega os novos dados enviados pelo cliente
    const { nome, email } = req.body;

    // Verifica se os campos obrigatórios foram preenchidos
    if (!nome || !email) {

        // Interrompe a execução e informa o problema
        return res.status(400).json({
            erro: "Nome e e-mail são obrigatórios"
        });
    }

    // Atualiza somente o usuário identificado pelo JWT
    const sql = `
        UPDATE usuarios
        SET
            nome = ?,
            email = ?
        WHERE id = ?
    `;

    // Executa a atualização no banco de dados
    conexao.query(
        sql,
        [nome, email, usuarioId],
        (erro, resultado) => {

            // Verifica se aconteceu algum erro
            if (erro) {

                // Verifica se o novo e-mail já pertence
                // a outra conta
                if (erro.code === "ER_DUP_ENTRY") {

                    // Retorna conflito
                    return res.status(409).json({
                        erro: "Este e-mail já está cadastrado"
                    });
                }

                // Mostra outros erros no terminal
                console.error(
                    "Erro ao atualizar perfil:",
                    erro.message
                );

                // Retorna erro genérico
                return res.status(500).json({
                    erro: "Erro ao atualizar perfil"
                });
            }

            // Verifica se o usuário não foi encontrado
            if (resultado.affectedRows === 0) {

                // Retorna erro informando que a conta não existe
                return res.status(404).json({
                    erro: "Usuário não encontrado"
                });
            }

            // Informa que o perfil foi atualizado
            res.json({
                mensagem: "Perfil atualizado com sucesso!"
            });
        }
    );
}


// ============================================================
// CADASTRAR USUÁRIO
// ============================================================

// Função responsável por cadastrar um novo usuário
async function cadastrarUsuario(req, res) {

    // Pega os dados enviados pelo cliente
    const { nome, email, senha } = req.body;

    // Verifica se algum campo obrigatório não foi preenchido
    if (!nome || !email || !senha) {

        // Interrompe a execução e informa o problema
        return res.status(400).json({
            erro: "Nome, e-mail e senha são obrigatórios"
        });
    }

    // Transforma a senha original em um hash
    // A senha verdadeira não será salva no banco
    const senhaHash = await bcrypt.hash(senha, 10);

    // Comando SQL utilizado para inserir o novo usuário
    const sql = `
        INSERT INTO usuarios (nome, email, senha)
        VALUES (?, ?, ?)
    `;

    // Salva o hash da senha no banco
    // Os valores são enviados separadamente para maior segurança
    conexao.query(
        sql,
        [nome, email, senhaHash],
        (erro, resultado) => {

            // Verifica se aconteceu algum erro no banco
            if (erro) {

                // Verifica se o e-mail já está cadastrado
                if (erro.code === "ER_DUP_ENTRY") {

                    // Retorna o status 409 para indicar conflito
                    return res.status(409).json({
                        erro: "Este e-mail já está cadastrado"
                    });
                }

                // Mostra outros erros no terminal
                console.error(
                    "Erro ao cadastrar usuário:",
                    erro.message
                );

                // Retorna um erro genérico
                return res.status(500).json({
                    erro: "Erro ao cadastrar usuário"
                });
            }

            // Informa que o cadastro foi realizado com sucesso
            res.status(201).json({
                mensagem: "Usuário cadastrado com sucesso!",
                id: resultado.insertId
            });
        }
    );
}


// ============================================================
// LOGIN
// ============================================================

// Função responsável pelo login do usuário
async function fazerLogin(req, res) {

    // Pega o e-mail e a senha enviados pelo cliente
    const { email, senha } = req.body;

    // Verifica se os dois campos foram preenchidos
    if (!email || !senha) {

        // Interrompe a execução se algum campo estiver faltando
        return res.status(400).json({
            erro: "E-mail e senha são obrigatórios"
        });
    }

    // Procura no banco um usuário pelo e-mail
    // A senha é necessária internamente para o bcrypt.compare()
    const sql = `
        SELECT id, nome, email, senha
        FROM usuarios
        WHERE email = ?
    `;

    // Executa a consulta utilizando o e-mail recebido
    conexao.query(
        sql,
        [email],
        async (erro, resultados) => {

            // Verifica se aconteceu algum erro na consulta
            if (erro) {

                // Mostra o erro no terminal
                console.error(
                    "Erro ao fazer login:",
                    erro.message
                );

                // Informa que aconteceu um problema no servidor
                return res.status(500).json({
                    erro: "Erro ao fazer login"
                });
            }

            // Verifica se nenhum usuário foi encontrado
            if (resultados.length === 0) {

                // Retorna erro de autenticação
                // Não informamos se foi o e-mail ou a senha
                return res.status(401).json({
                    erro: "E-mail ou senha incorretos"
                });
            }

            // Guarda o usuário encontrado no banco
            const usuario = resultados[0];

            // Compara a senha digitada com o hash armazenado
            const senhaCorreta = await bcrypt.compare(
                senha,
                usuario.senha
            );

            // Verifica se a senha não corresponde ao hash
            if (!senhaCorreta) {

                // Retorna erro de autenticação
                return res.status(401).json({
                    erro: "E-mail ou senha incorretos"
                });
            }

            // ====================================================
            // CRIAÇÃO DO TOKEN JWT
            // ====================================================

            // Cria um token JWT contendo o ID do usuário
            const token = jwt.sign(

                // Informações que serão colocadas dentro do token
                {
                    id: usuario.id
                },

                // Usa a chave secreta armazenada no arquivo .env
                process.env.JWT_SECRET,

                // Define por quanto tempo o token será válido
                {
                    expiresIn: "1h"
                }
            );

            // Envia o token junto com as informações básicas do usuário
            res.json({

                // Mensagem informando que o login funcionou
                mensagem: "Login realizado com sucesso!",

                // Token que será utilizado nas próximas requisições
                token: token,

                // Informações básicas do usuário
                // A senha nunca é enviada
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email
                }
            });
        }
    );
}


// ============================================================
// EXPORTAÇÃO
// ============================================================

// Exporta as funções para serem utilizadas pelas rotas
module.exports = {
    buscarUsuarios,
    buscarMeuPerfil,
    atualizarMeuPerfil,
    cadastrarUsuario,
    fazerLogin
};