-- Active: 1780405368569@@127.0.0.1@3306@s_peak
-- S-PEAK Database Schema
-- Run this file to reset and recreate the entire database cleanly

USE s_peak;

-- Drop in reverse FK order
DROP TABLE IF EXISTS evaluations;
DROP TABLE IF EXISTS transcripts;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;

-- Users
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    google_id     VARCHAR(255) NULL UNIQUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions
CREATE TABLE sessions (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    mode       VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Transcripts
CREATE TABLE transcripts (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    session_id    INT NOT NULL,
    raw_text      TEXT NOT NULL,
    enhanced_text TEXT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Evaluations
CREATE TABLE evaluations (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    transcript_id    INT NOT NULL,
    topic            VARCHAR(500) NOT NULL,
    content_score    INT NOT NULL,
    fluency_score    INT NOT NULL,
    grammar_score    INT NOT NULL,
    overall_score    INT NOT NULL,
    corrected_answer TEXT NOT NULL,
    feedback         TEXT NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transcript_id) REFERENCES transcripts(id)
);

-- Verify
SHOW TABLES;
DESCRIBE users;
DESCRIBE sessions;
DESCRIBE transcripts;
DESCRIBE evaluations;

USE s_peak;
SELECT id, email, password_hash FROM users;

SHOW DATABASES;
ALTER TABLE users ADD COLUMN name VARCHAR(255);

select * from users;