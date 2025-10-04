CREATE TABLE secrets (
    id VARCHAR(255) PRIMARY KEY,
    description TEXT,
    value TEXT NOT NULL,
    nonce VARCHAR(24) NOT NULL,
    salt VARCHAR(24) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL
);
