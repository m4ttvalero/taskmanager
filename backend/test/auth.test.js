const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const secret = "a-test-secret-that-is-longer-than-32-characters";
process.env.JWT_SECRET = secret;
const autenticarUsuario = require("../middlewares/authMiddleware");

function executarMiddleware(authorization) {
    const req = { headers: { authorization } };
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
    let continuou = false;

    autenticarUsuario(req, res, () => {
        continuou = true;
    });

    return { req, res, continuou };
}

test("nega requisição sem credencial", () => {
    const resultado = executarMiddleware(undefined);

    assert.equal(resultado.res.statusCode, 401);
    assert.equal(resultado.continuou, false);
});

test("aceita apenas JWT assinado com HS256 e ID inteiro positivo", () => {
    const token = jwt.sign({ id: 42 }, secret, { algorithm: "HS256" });
    const resultado = executarMiddleware(`Bearer ${token}`);

    assert.equal(resultado.continuou, true);
    assert.equal(resultado.req.usuario.id, 42);
});

test("rejeita algoritmo diferente e claim de ID inválida", () => {
    const tokenOutroAlgoritmo = jwt.sign({ id: 42 }, secret, { algorithm: "HS384" });
    const idInvalido = jwt.sign({ id: "42" }, secret, { algorithm: "HS256" });

    assert.equal(executarMiddleware(`Bearer ${tokenOutroAlgoritmo}`).res.statusCode, 401);
    assert.equal(executarMiddleware(`Bearer ${idInvalido}`).res.statusCode, 401);
});