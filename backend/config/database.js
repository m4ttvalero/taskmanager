const mysql = require("mysql2");

require("dotenv").config();

const conexao = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    dateStrings: true,
    ssl: process.env.DB_SSL === "true"
        ? {
            rejectUnauthorized: true,
            ca: process.env.DB_SSL_CA || undefined
        }
        : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true
});

module.exports = conexao;