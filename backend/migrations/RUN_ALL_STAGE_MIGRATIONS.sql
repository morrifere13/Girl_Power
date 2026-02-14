-- ==============================================================================
-- SCRIPT D'EXÉCUTION COMPLÈTE DES MIGRATIONS POUR LE MODULE STAGES
-- ==============================================================================
-- Description: Exécute toutes les migrations nécessaires pour le module de
--              gestion des stages en entreprise
-- Ordre: 004 → 005 → 006 → 007
-- Prérequis: Tables users, candidates, cohortes, projects doivent exister
-- ==============================================================================

USE girl_power_db;

-- ==============================================================================
-- MIGRATION 004: Création de la table entreprises
-- ==============================================================================

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

-- ==============================================================================
-- MIGRATION 005: Création de la table stages
-- ==============================================================================

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

-- ==============================================================================
-- MIGRATION 006: Création de la table stage_evaluations
-- ==============================================================================

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

-- ==============================================================================
-- MIGRATION 007: Mise à jour de la table candidates pour les stages
-- ==============================================================================

-- Ajouter les nouvelles colonnes
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS en_stage BOOLEAN DEFAULT FALSE COMMENT 'Actuellement en stage',
ADD COLUMN IF NOT EXISTS nombre_stages_effectues INT DEFAULT 0 COMMENT 'Total stages effectués',
ADD COLUMN IF NOT EXISTS dernier_stage_id INT COMMENT 'Référence au dernier stage',
ADD COLUMN IF NOT EXISTS disponible_stage BOOLEAN DEFAULT TRUE COMMENT 'Disponible pour nouveau stage';

-- Ajouter la contrainte de clé étrangère
ALTER TABLE candidates
ADD CONSTRAINT fk_candidates_derniers_stage
FOREIGN KEY (dernier_stage_id) REFERENCES stages(id) ON DELETE SET NULL;

-- Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_en_stage ON candidates(en_stage);
CREATE INDEX IF NOT EXISTS idx_disponible_stage ON candidates(disponible_stage);
CREATE INDEX IF NOT EXISTS idx_dernier_stage ON candidates(dernier_stage_id);

-- ==============================================================================
-- FIN DES MIGRATIONS
-- ==============================================================================

SELECT 'Migrations terminées avec succès !' AS message;

-- Vérification des tables créées
SHOW TABLES LIKE '%entreprise%';
SHOW TABLES LIKE '%stage%';

-- Afficher les colonnes des nouvelles tables
DESCRIBE entreprises;
DESCRIBE stages;
DESCRIBE stage_evaluations;
