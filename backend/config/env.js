function loadConfig(variables = process.env) {
    const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "JWT_SECRET"];
    const missing = required.filter((key) => variables[key] === undefined);

    if (missing.length > 0) {
        throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missing.join(", ")}`);
    }

    if (variables.JWT_SECRET.length < 32 || variables.JWT_SECRET.toLowerCase().includes("replace-with")) {
        throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres");
    }

    const port = Number(variables.PORT || 3000);
    const databasePort = Number(variables.DB_PORT || 3306);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT deve ser um número entre 1 e 65535");
    }

    if (!Number.isInteger(databasePort) || databasePort < 1 || databasePort > 65535) {
        throw new Error("DB_PORT deve ser um número entre 1 e 65535");
    }

    const corsOrigins = (variables.CORS_ORIGIN || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    for (const origin of corsOrigins) {
        let parsedOrigin;

        try {
            parsedOrigin = new URL(origin);
        } catch {
            throw new Error(`Origem inválida em CORS_ORIGIN: ${origin}`);
        }

        if (parsedOrigin.origin !== origin || !["http:", "https:"].includes(parsedOrigin.protocol)) {
            throw new Error(`CORS_ORIGIN deve conter origens HTTP/HTTPS exatas: ${origin}`);
        }
    }

    const nodeEnv = variables.NODE_ENV || "development";
    if (!["development", "production", "test"].includes(nodeEnv)) {
        throw new Error("NODE_ENV deve ser development, production ou test");
    }

    if (nodeEnv === "production" && corsOrigins.length === 0) {
        throw new Error("CORS_ORIGIN deve conter pelo menos uma origem em produção");
    }

    if (variables.DB_SSL !== undefined && !["true", "false"].includes(variables.DB_SSL)) {
        throw new Error("DB_SSL deve ser true ou false");
    }

    if (variables.FEEDBACK_ADMIN_TOKEN && variables.FEEDBACK_ADMIN_TOKEN.length < 32) {
        throw new Error("FEEDBACK_ADMIN_TOKEN deve ter pelo menos 32 caracteres");
    }

    const smtpValues = [variables.SMTP_HOST, variables.SMTP_USER, variables.SMTP_APP_PASSWORD];
    const smtpConfigured = smtpValues.every(Boolean);
    const smtpPartiallyConfigured = smtpValues.some(Boolean) && !smtpConfigured;

    if (smtpPartiallyConfigured) {
        throw new Error("Configure SMTP_HOST, SMTP_USER e SMTP_APP_PASSWORD juntos");
    }

    const smtpPort = Number(variables.SMTP_PORT || 465);
    if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
        throw new Error("SMTP_PORT deve ser um número entre 1 e 65535");
    }

    return {
        port,
        databasePort,
        corsOrigins,
        nodeEnv,
        feedbackAdminToken: variables.FEEDBACK_ADMIN_TOKEN || "",
        feedbackSmtp: smtpConfigured
            ? {
                host: variables.SMTP_HOST,
                port: smtpPort,
                secure: smtpPort === 465,
                user: variables.SMTP_USER,
                password: variables.SMTP_APP_PASSWORD
            }
            : null
    };
}

module.exports = loadConfig;