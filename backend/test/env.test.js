const test = require("node:test");
const assert = require("node:assert/strict");
const loadConfig = require("../config/env");

const validEnvironment = {
    DB_HOST: "localhost",
    DB_USER: "app",
    DB_PASSWORD: "",
    DB_NAME: "tasks",
    JWT_SECRET: "a-secure-test-secret-with-more-than-32-characters",
    NODE_ENV: "test"
};

test("aceita configuração válida e usa portas padrão", () => {
    const config = loadConfig(validEnvironment);

    assert.equal(config.port, 3000);
    assert.equal(config.databasePort, 3306);
    assert.deepEqual(config.corsOrigins, []);
});

test("recusa variáveis obrigatórias ausentes", () => {
    assert.throws(
        () => loadConfig({ ...validEnvironment, DB_HOST: undefined }),
        /DB_HOST/
    );
});

test("recusa segredo JWT abaixo do mínimo", () => {
    assert.throws(
        () => loadConfig({ ...validEnvironment, JWT_SECRET: "short" }),
        /pelo menos 32 caracteres/
    );
});

test("recusa origem CORS inválida ou curinga", () => {
    assert.throws(
        () => loadConfig({ ...validEnvironment, CORS_ORIGIN: "*" }),
        /origem inválida/i
    );
});

test("aceita uma lista explícita de origens CORS", () => {
    const config = loadConfig({
        ...validEnvironment,
        CORS_ORIGIN: "https://app.example.com,https://admin.example.com"
    });

    assert.deepEqual(config.corsOrigins, [
        "https://app.example.com",
        "https://admin.example.com"
    ]);
});

test("exige uma origem CORS explícita em produção", () => {
    assert.throws(
        () => loadConfig({ ...validEnvironment, NODE_ENV: "production" }),
        /CORS_ORIGIN/
    );
});

test("recusa o segredo de exemplo conhecido", () => {
    assert.throws(
        () => loadConfig({
            ...validEnvironment,
            JWT_SECRET: "replace-with-a-random-secret-of-at-least-32-characters"
        }),
        /JWT_SECRET/
    );
});

test("recusa token administrativo curto", () => {
    assert.throws(
        () => loadConfig({ ...validEnvironment, FEEDBACK_ADMIN_TOKEN: "short" }),
        /FEEDBACK_ADMIN_TOKEN/
    );
});

test("exige configuração SMTP completa quando o envio por e-mail é ativado", () => {
    assert.throws(
        () => loadConfig({ ...validEnvironment, SMTP_HOST: "smtp.gmail.com" }),
        /SMTP_HOST, SMTP_USER e SMTP_APP_PASSWORD juntos/
    );
});

test("configura Gmail SMTP seguro quando as credenciais são fornecidas", () => {
    const config = loadConfig({
        ...validEnvironment,
        SMTP_HOST: "smtp.gmail.com",
        SMTP_USER: "taskmanagercontato@gmail.com",
        SMTP_APP_PASSWORD: "app-password-for-test-only"
    });

    assert.equal(config.feedbackSmtp.host, "smtp.gmail.com");
    assert.equal(config.feedbackSmtp.port, 465);
    assert.equal(config.feedbackSmtp.secure, true);
});