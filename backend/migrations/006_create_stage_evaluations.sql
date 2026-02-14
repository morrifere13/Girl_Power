-- Migration: Création de la table stage_evaluations
-- Auteur: Claude Assistant
-- Date: 2026-01-17
-- Description: Table pour stocker les évaluations périodiques pendant le stage

CREATE TABLE IF NOT EXISTS stage_evaluations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  stage_id INT NOT NULL,

  -- Période d'évaluation
  date_evaluation DATE NOT NULL,
  periode VARCHAR(50) COMMENT 'Début, Mi-parcours, Fin, etc.',

  -- Évaluateur
  evaluateur_nom VARCHAR(255),
  evaluateur_type ENUM('Tuteur entreprise', 'Formateur centre', 'Coordinateur projet') NOT NULL,

  -- Critères d'évaluation (sur 5)
  note_competences_techniques DECIMAL(3,2),
  note_comportement_professionnel DECIMAL(3,2),
  note_assiduite DECIMAL(3,2),
  note_autonomie DECIMAL(3,2),
  note_integration DECIMAL(3,2),
  note_globale DECIMAL(3,2),

  -- Commentaires
  points_forts TEXT,
  points_amelioration TEXT,
  commentaire_general TEXT,
  recommandations TEXT,

  -- Audit
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),

  INDEX idx_stage (stage_id),
  INDEX idx_date (date_evaluation),
  INDEX idx_evaluateur_type (evaluateur_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
