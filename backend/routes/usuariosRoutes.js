// Importa o Express
const express = require("express");

// Importa o Controller responsável pelas operações dos usuários
const usuariosController = require("../controllers/usuariosController");

// Importa o middleware responsável por verificar o JWT
const autenticarUsuario = require("../middlewares/authMiddleware");

// Cria um Router para organizar as rotas
const router = express.Router();


// ============================================================
// ROTAS PÚBLICAS
// ============================================================

// Rota GET para buscar todos os usuários
router.get(
    "/",
    usuariosController.buscarUsuarios
);


// Rota POST para cadastrar um novo usuário
router.post(
    "/",
    usuariosController.cadastrarUsuario
);


// Rota POST utilizada para realizar o login
router.post(
    "/login",
    usuariosController.fazerLogin
);


// ============================================================
// ROTAS PROTEGIDAS
// ============================================================

// Rota GET para buscar os dados do próprio usuário
// O middleware verifica o JWT antes de chamar o controller
router.get(
    "/me",
    autenticarUsuario,
    usuariosController.buscarMeuPerfil
);


// Rota PUT para atualizar o próprio perfil
// O usuário só pode alterar a própria conta
// porque o ID vem do JWT
router.put(
    "/me",
    autenticarUsuario,
    usuariosController.atualizarMeuPerfil
);


// Rota protegida utilizada para testar a autenticação
router.get(
    "/teste-protegida",
    autenticarUsuario,
    (req, res) => {

        // Se chegou aqui, o JWT foi validado
        res.json({
            mensagem: "Você acessou uma rota protegida!",
            usuario: req.usuario
        });
    }
);


// Exporta o Router para ser utilizado pelo server.js
module.exports = router;