CREATE DATABASE IF NOT EXISTS task_manager
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE task_manager;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tarefas (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id INT UNSIGNED NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    `data` DATE NOT NULL,
    importancia ENUM('baixa', 'media', 'alta') NOT NULL DEFAULT 'media',
    descricao VARCHAR(500) NULL,
    concluida BOOLEAN NOT NULL DEFAULT FALSE,
    fixada BOOLEAN NOT NULL DEFAULT FALSE,
    criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY ix_tarefas_usuario_data (usuario_id, `data`),
    CONSTRAINT fk_tarefas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feedback_messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id INT UNSIGNED NULL,
    nome_usuario VARCHAR(100) NOT NULL,
    email_usuario VARCHAR(254) NOT NULL,
    mensagem TEXT NOT NULL,
    criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY ix_feedback_criada_em (criada_em),
    KEY ix_feedback_usuario_id (usuario_id),
    CONSTRAINT fk_feedback_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;