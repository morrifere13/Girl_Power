-- Migration: Création de la table entreprises
-- Auteur: Claude Assistant
-- Date: 2026-01-17
-- Description: Table pour gérer les entreprises partenaires qui accueillent des stagiaires

CREATE TABLE IF NOT EXISTS entreprises (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  nom VARCHAR(255) NOT NULL,
  secteur_activite VARCHAR(100),

  -- Contact
  adresse TEXT,
  region VARCHAR(100),
  ville VARCHAR(100),
  telephone VARCHAR(20),
  telephone_2 VARCHAR(20),
  email VARCHAR(255),

  -- Responsable
  responsable_nom VARCHAR(255),
  responsable_fonction VARCHAR(100),
  responsable_contact VARCHAR(20),
  responsable_email VARCHAR(255),

  -- Capacité d'accueil
  capacite_stagiaires_max INT DEFAULT 5,
  metiers_proposes JSON COMMENT 'Liste des métiers proposés pour stages',

  -- Partenariat
  type_partenariat ENUM('Convention', 'Accord cadre', 'Partenariat ponctuel', 'Autre') DEFAULT 'Partenariat ponctuel',
  date_convention DATE,
  duree_convention_mois INT,
  conditions_partenariat TEXT,

  -- Évaluation et historique
  nombre_stagiaires_accueillis INT DEFAULT 0,
  taux_reussite DECIMAL(5,2) COMMENT 'Pourcentage de stagiaires ayant réussi',
  note_evaluation DECIMAL(3,2) COMMENT 'Note sur 5',
  commentaires_evaluation TEXT,

  -- Statut et audit
  statut ENUM('Actif', 'Inactif', 'Suspendu') DEFAULT 'Actif',
  logo_url VARCHAR(500),
  description TEXT,

  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,

  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_secteur (secteur_activite),
  INDEX idx_region (region),
  INDEX idx_statut (statut),
  INDEX idx_code (code),
  INDEX idx_nom (nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
