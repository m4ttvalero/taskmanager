// Importa o jsonwebtoken para verificar os tokens
const jwt = require("jsonwebtoken");


// Middleware responsável por verificar se o usuário está autenticado
function autenticarUsuario(req, res, next) {

    // Pega o cabeçalho Authorization enviado na requisição
    const authHeader = req.headers.authorization;

    // Verifica se o cabeçalho não foi enviado
    if (!authHeader) {

        // Bloqueia a requisição porque não existe token
        return res.status(401).json({
            erro: "Token de autenticação não informado"
        });
    }

    // O padrão do Authorization será:
    // Bearer TOKEN
    const partes = authHeader.split(" ");

    // Separa a palavra "Bearer" do token
    const tipo = partes[0];

    // Pega somente o token
    const token = partes[1];

    // Verifica se o formato enviado está correto
    if (tipo !== "Bearer" || !token) {

        // Bloqueia a requisição porque o formato está incorreto
        return res.status(401).json({
            erro: "Formato do token inválido"
        });
    }

    try {

        // Verifica se o token foi criado usando nossa chave secreta
        const usuario = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Guarda os dados do usuário dentro da requisição
        // Isso permite que outras partes do backend saibam
        // qual usuário está fazendo a requisição
        req.usuario = usuario;

        // Permite que a requisição continue
        next();

    } catch (erro) {

        // Se o token for inválido ou estiver expirado,
        // a requisição será bloqueada
        return res.status(401).json({
            erro: "Token inválido ou expirado"
        });
    }
}


// Exporta o middleware para ser utilizado pelas rotas
module.exports = autenticarUsuario;