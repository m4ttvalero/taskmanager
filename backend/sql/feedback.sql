CREATE TABLE IF NOT EXISTS feedback_messages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id INT NULL,
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