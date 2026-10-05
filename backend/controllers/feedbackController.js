const conexao = require("../config/database");
const nodemailer = require("nodemailer");

const emailDestino = "taskmanagercontato@gmail.com";

async function enviarFeedback(req, res) {
    const mensagem = typeof req.body?.mensagem === "string"
        ? req.body.mensagem.trim()
        : "";

    if (!mensagem || mensagem.length > 3000) {
        return res.status(400).json({
            erro: "A mensagem deve conter de 1 a 3000 caracteres"
        });
    }

    const banco = conexao.promise();

    try {
        const [[usuario]] = await banco.query(
            "SELECT id, nome, email FROM usuarios WHERE id = ?",
            [req.usuario.id]
        );

        if (!usuario) {
            return res.status(404).json({ erro: "Usuário não encontrado" });
        }

        const [resultado] = await banco.query(
            `INSERT INTO feedback_messages
                (usuario_id, nome_usuario, email_usuario, mensagem)
             VALUES (?, ?, ?, ?)`,
            [usuario.id, usuario.nome, usuario.email, mensagem]
        );

        const smtp = req.app.locals.feedbackSmtp;
        if (!smtp) {
            return res.status(202).json({
                mensagem: "Mensagem salva, mas o envio por e-mail ainda não foi configurado.",
                emailEnviado: false,
                id: resultado.insertId
            });
        }

        try {
            const transporter = req.app.locals.feedbackMailer || nodemailer.createTransport({
                host: smtp.host,
                port: smtp.port,
                secure: smtp.secure,
                auth: { user: smtp.user, pass: smtp.password }
            });

            await transporter.sendMail({
                from: smtp.user,
                to: emailDestino,
                replyTo: usuario.email,
                subject: `Task Manager: nova mensagem #${resultado.insertId}`,
                text: [
                    "Nova mensagem recebida pelo Task Manager.",
                    "",
                    `Usuário: ${usuario.nome}`,
                    `E-mail: ${usuario.email}`,
                    `ID da mensagem: ${resultado.insertId}`,
                    "",
                    "Mensagem:",
                    mensagem
                ].join("\n")
            });
        } catch (erroEmail) {
            console.error("Falha no envio SMTP da mensagem de contato:", erroEmail.code || "erro SMTP");
            return res.status(202).json({
                mensagem: "Mensagem salva, mas o e-mail não pôde ser enviado agora.",
                emailEnviado: false,
                id: resultado.insertId
            });
        }

        return res.status(201).json({
            mensagem: "Mensagem enviada por e-mail. Obrigado pelo contato!",
            emailEnviado: true,
            id: resultado.insertId
        });
    } catch (erro) {
        console.error("Erro ao salvar mensagem de contato:", erro.message);
        return res.status(500).json({ erro: "Não foi possível salvar a mensagem" });
    }
}

function listarMensagens(req, res) {
    const limite = Number(req.query.limite || 50);
    if (!Number.isInteger(limite) || limite < 1 || limite > 100) {
        return res.status(400).json({ erro: "limite deve estar entre 1 e 100" });
    }

    const sql = `
        SELECT id, usuario_id, nome_usuario, email_usuario, mensagem, criada_em
        FROM feedback_messages
        ORDER BY id DESC
        LIMIT ?
    `;

    conexao.query(sql, [limite], (erro, mensagens) => {
        if (erro) {
            console.error("Erro ao consultar mensagens de contato:", erro.message);
            return res.status(500).json({ erro: "Não foi possível consultar mensagens" });
        }

        return res.json(mensagens);
    });
}

module.exports = { enviarFeedback, listarMensagens };