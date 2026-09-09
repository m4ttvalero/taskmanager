// Importa o Express
const express = require("express");

// Importa o Controller responsável pelas tarefas
const tarefasController = require("../controllers/tarefasController");

// Importa o middleware responsável por verificar o JWT
const autenticarUsuario = require("../middlewares/authMiddleware");

// Cria um Router para organizar as rotas
const router = express.Router();


// ============================================================
// ROTAS PROTEGIDAS DE TAREFAS
// ============================================================

// Rota GET para buscar as tarefas do usuário autenticado
// O middleware verifica o JWT antes de chamar o controller
router.get(
    "/",
    autenticarUsuario,
    tarefasController.buscarTarefas
);


// Rota POST para criar uma nova tarefa
// O middleware verifica o JWT antes de chamar o controller
router.post(
    "/",
    autenticarUsuario,
    tarefasController.criarTarefa
);


// Rota PUT para atualizar uma tarefa
// O :id representa o ID da tarefa que será atualizada
// O middleware verifica o JWT antes de chamar o controller
router.put(
    "/:id",
    autenticarUsuario,
    tarefasController.atualizarTarefa
);


// Rota DELETE para excluir uma tarefa
// O :id representa o ID da tarefa que será excluída
// O middleware verifica o JWT antes de chamar o controller
router.delete(
    "/:id",
    autenticarUsuario,
    tarefasController.excluirTarefa
);


// Exporta o Router para ser utilizado pelo server.js
module.exports = router;