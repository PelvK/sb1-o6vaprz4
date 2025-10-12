CREATE DATABASE IF NOT EXISTS vps4_infantiles_valesanito_planilla CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vps4_infantiles_valesanito_planilla;

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,                -- username, no full_name
    email VARCHAR(255) NOT NULL UNIQUE,
    is_admin BOOLEAN DEFAULT FALSE,                -- booleano, NO enum
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de equipos (Team)
CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(255) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,                  -- nombre, no name
    category INT NOT NULL,                         -- usa el enum Category (ej: 2014, 2015...)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de planillas
CREATE TABLE IF NOT EXISTS planillas (
    id VARCHAR(255) PRIMARY KEY,
    team_id VARCHAR(255) NOT NULL,
    status ENUM('Pendiente de envío', 'Pendiente de aprobación', 'Aprobada') DEFAULT 'Pendiente de envío',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de jugadores (Jugador)
CREATE TABLE IF NOT EXISTS jugadores (
    id VARCHAR(255) PRIMARY KEY,
    planilla_id VARCHAR(255) NOT NULL,
    dni VARCHAR(20) NOT NULL,
    number INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    second_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (planilla_id) REFERENCES planillas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de personas (Persona)
CREATE TABLE IF NOT EXISTS personas (
    id VARCHAR(255) PRIMARY KEY,
    planilla_id VARCHAR(255) NOT NULL,
    dni VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    second_name VARCHAR(255),
    phone_number VARCHAR(30),
    charge ENUM('Técnico', 'Delegado', 'Médico') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (planilla_id) REFERENCES planillas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de usuario asignado a planilla
CREATE TABLE IF NOT EXISTS user_planilla (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    planilla_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (planilla_id) REFERENCES planillas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de auditoría (AuditLog)
CREATE TABLE IF NOT EXISTS audit_log (
    id VARCHAR(255) PRIMARY KEY,
    planilla_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    action ENUM('jugador_added','jugador_deleted','persona_added','persona_deleted','status_changed') NOT NULL,
    entity_type ENUM('jugador','persona','planilla'),
    entity_id VARCHAR(255),
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(255),
    FOREIGN KEY (planilla_id) REFERENCES planillas(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
