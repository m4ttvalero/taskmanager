const mysql = require("mysql2");

// Carrega as informações armazenadas no arquivo .env
require("dotenv").config();

// Cria uma conexão com o banco de dados MySQL
const conexao = mysql.createConnection({

    // Endereço onde o MySQL está funcionando
    host: process.env.DB_HOST,

    // Usuário utilizado para entrar no MySQL
    user: process.env.DB_USER,

    // Senha armazenada no arquivo .env
    password: process.env.DB_PASSWORD,

    // Banco de dados que criamos anteriormente
    database: process.env.DB_NAME,

    // Porta utilizada pelo MySQL
    port: process.env.DB_PORT

});

// Tenta estabelecer a conexão com o MySQL
conexao.connect((erro) => {

    // Verifica se aconteceu algum problema
    if (erro) {

        // Mostra o erro no terminal
        console.error("Erro ao conectar ao MySQL:", erro.message);

        return;
    }

    // Executado quando a conexão é estabelecida com sucesso
    console.log("Conectado ao MySQL com sucesso!");

});

// Exporta a conexão para outros arquivos do backend
module.exports = conexao;