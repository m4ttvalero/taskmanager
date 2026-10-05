const crypto = require("node:crypto");
const express = require("express");
const { rateLimit } = require("express-rate-limit");
const feedbackController = require("../controllers/feedbackController");
const autenticarUsuario = require("../middlewares/authMiddleware");

const router = express.Router();
const limitarEnvio = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: "Limite de mensagens atingido. Tente novamente mais tarde." }
});
const limitarInbox = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false
});

function autenticarAcessoInbox(req, res, next) {
    const tokenEsperado = req.app.locals.feedbackAdminToken;
    if (!tokenEsperado) {
        return res.status(503).json({ erro: "A caixa administrativa ainda não foi configurada" });
    }

    const tokenRecebido = req.get("x-feedback-admin-token") || "";
    const esperado = Buffer.from(tokenEsperado);
    const recebido = Buffer.from(tokenRecebido);

    if (esperado.length !== recebido.length || !crypto.timingSafeEqual(esperado, recebido)) {
        return res.status(403).json({ erro: "Acesso negado" });
    }

    return next();
}

router.post("/", autenticarUsuario, limitarEnvio, feedbackController.enviarFeedback);
router.get("/inbox", limitarInbox, autenticarAcessoInbox, feedbackController.listarMensagens);

module.exports = router;