const express = require("express");

// Importa a conexão com o banco de dados MySQL
require("./config/database");

// Importa as rotas relacionadas às tarefas
const tarefasRoutes = require("./routes/tarefasRoutes");

// Importa as rotas relacionadas aos usuários
const usuariosRoutes = require("./routes/usuariosRoutes");

// Cria a aplicação usando o Express
const app = express();

// Permite que o Express entenda dados enviados em formato JSON
app.use(express.json());

// Rota inicial da API
app.get("/", (req, res) => {

    // Envia uma mensagem como resposta
    res.send("Task Manager API funcionando!");

});

// Define que as rotas de tarefas começam com /tarefas
app.use("/tarefas", tarefasRoutes);

// Define que as rotas de usuários começam com /usuarios
app.use("/usuarios", usuariosRoutes);

// Inicia o servidor na porta 3000
app.listen(3000, () => {

    // Mostra no terminal que o servidor foi iniciado
    console.log("Servidor rodando na porta 3000");

});