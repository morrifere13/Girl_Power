-- Migration: Création de la table stages
-- Auteur: Claude Assistant
-- Date: 2026-01-17
-- Description: Table pour gérer les affectations de stages (relation entre candidate et entreprise)

CREATE TABLE IF NOT EXISTS stages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,

  -- Relations
  candidate_id INT NOT NULL,
  entreprise_id INT NOT NULL,
  cohorte_id INT COMMENT 'Optionnel: stage lié à une cohorte',
  projet_id INT COMMENT 'Optionnel: stage lié à un projet',

  -- Période et durée
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  duree_mois INT GENERATED ALWAYS AS (TIMESTAMPDIFF(MONTH, date_debut, date_fin)) STORED,

  -- Type et poste
  type_stage ENUM('Stage pendant formation', 'Stage post-formation', 'Stage insertion') NOT NULL,
  metier_stage VARCHAR(100) NOT NULL COMMENT 'Métier/Poste occupé en stage',

  -- Suivi et encadrement
  tuteur_nom VARCHAR(255),
  tuteur_fonction VARCHAR(100),
  tuteur_contact VARCHAR(20),
  tuteur_email VARCHAR(255),

  -- Évaluation
  note_entreprise DECIMAL(3,2) COMMENT 'Note donnée par entreprise sur 5',
  note_tuteur DECIMAL(3,2) COMMENT 'Note donnée par le tuteur sur 5',
  commentaire_entreprise TEXT,
  rapport_stage_url VARCHAR(500),
  competences_acquises JSON COMMENT 'Liste des compétences acquises',

  -- Présence et assiduité
  nombre_jours_absence INT DEFAULT 0,
  taux_presence DECIMAL(5,2) COMMENT 'Pourcentage de présence',

  -- Statut
  statut ENUM('Planifié', 'En cours', 'Terminé', 'Abandonné', 'Annulé') DEFAULT 'Planifié',
  motif_abandon TEXT COMMENT 'Si abandonné ou annulé',

  -- Conditions (optionnelles)
  indemnite_mensuelle DECIMAL(10,2),
  frais_transport DECIMAL(10,2),
  autres_avantages TEXT,

  -- Observations
  observations TEXT,

  -- Audit
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,

  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (entreprise_id) REFERENCES entreprises(id) ON DELETE CASCADE,
  FOREIGN KEY (cohorte_id) REFERENCES cohortes(id) ON DELETE SET NULL,
  FOREIGN KEY (projet_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),

  INDEX idx_candidate (candidate_id),
  INDEX idx_entreprise (entreprise_id),
  INDEX idx_dates (date_debut, date_fin),
  INDEX idx_statut (statut),
  INDEX idx_type (type_stage),
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
