const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const loadConfig = require("./config/env");
const conexao = require("./config/database");

const tarefasRoutes = require("./routes/tarefasRoutes");
const usuariosRoutes = require("./routes/usuariosRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

function createApp(config = loadConfig()) {
    const app = express();
    const corsOrigins = new Set(config.corsOrigins);
    app.locals.feedbackAdminToken = config.feedbackAdminToken || "";
    app.locals.feedbackSmtp = config.feedbackSmtp || null;

    app.disable("x-powered-by");
    app.use(helmet());
    app.use(cors({
        origin(origin, callback) {
            if (
                !origin ||
                corsOrigins.has(origin) ||
                (config.nodeEnv !== "production" && corsOrigins.size === 0)
            ) {
                return callback(null, true);
            }

            return callback(new Error("Origem não permitida"));
        }
    }));
    app.use(express.json({ limit: "20kb" }));
    app.use(rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 300,
        standardHeaders: true,
        legacyHeaders: false
    }));

    app.get("/", (req, res) => {
        res.json({ mensagem: "Task Manager API funcionando!" });
    });

    app.get("/health", async (req, res) => {
        try {
            await conexao.promise().query("SELECT 1");
            return res.json({ status: "ok" });
        } catch (erro) {
            console.error("Health check do banco falhou:", erro.message);
            return res.status(503).json({ status: "indisponivel" });
        }
    });

    app.use("/tarefas", tarefasRoutes);
    app.use("/usuarios", usuariosRoutes);
    app.use("/feedback", feedbackRoutes);

    app.use((req, res) => {
        res.status(404).json({ erro: "Rota não encontrada" });
    });

    app.use((erro, req, res, next) => {
        if (res.headersSent) {
            return next(erro);
        }

        if (erro.message === "Origem não permitida") {
            return res.status(403).json({ erro: erro.message });
        }

        if (erro.type === "entity.too.large") {
            return res.status(413).json({ erro: "Corpo da requisição excede o limite permitido" });
        }

        if (erro.type === "entity.parse.failed") {
            return res.status(400).json({ erro: "JSON inválido" });
        }

        console.error("Erro não tratado na API:", erro.message);
        return res.status(500).json({ erro: "Erro interno do servidor" });
    });

    return app;
}

async function startServer() {
    const config = loadConfig();
    await new Promise((resolve, reject) => {
        conexao.getConnection((erro, connection) => {
            if (erro) {
                return reject(erro);
            }

            connection.release();
            return resolve();
        });
    });

    console.log("Conectado ao MySQL com sucesso!");
    const server = createApp(config).listen(config.port, () => {
        console.log(`Servidor rodando na porta ${config.port}`);
    });

    const encerrar = (sinal) => {
        console.log(`Recebido ${sinal}; encerrando servidor...`);
        server.close(() => {
            conexao.end(() => process.exit(0));
        });
    };

    process.once("SIGINT", () => encerrar("SIGINT"));
    process.once("SIGTERM", () => encerrar("SIGTERM"));
}

if (require.main === module) {
    startServer().catch((erro) => {
        console.error("Falha ao iniciar a API:", erro.message);
        conexao.end(() => process.exit(1));
    });
}

module.exports = { createApp, startServer };