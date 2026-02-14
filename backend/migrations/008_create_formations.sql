-- Migration 008: Create formations table
-- Suivi des formations des candidates admises

CREATE TABLE IF NOT EXISTS formations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    candidate_id INT NOT NULL,
    cohorte_id INT,
    centre_id INT,
    projet_id INT,

    -- Dates de formation
    date_debut DATE NOT NULL,
    date_fin_prevue DATE,
    date_fin_effective DATE,

    -- Statut
    statut ENUM('En formation', 'Abandonné', 'Terminé') DEFAULT 'En formation',

    -- Abandon
    date_abandon DATE,
    motif_abandon VARCHAR(255),
    details_abandon TEXT,
    circonstances_abandon TEXT,
    signale_par VARCHAR(255),

    -- Observations
    observations TEXT,

    -- Audit
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    -- Foreign keys
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (cohorte_id) REFERENCES cohortes(id) ON DELETE SET NULL,
    FOREIGN KEY (centre_id) REFERENCES centres(id) ON DELETE SET NULL,
    FOREIGN KEY (projet_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

    -- Index
    INDEX idx_formations_candidate (candidate_id),
    INDEX idx_formations_cohorte (cohorte_id),
    INDEX idx_formations_centre (centre_id),
    INDEX idx_formations_projet (projet_id),
    INDEX idx_formations_statut (statut),
    INDEX idx_formations_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
