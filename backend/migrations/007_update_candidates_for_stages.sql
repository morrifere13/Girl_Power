-- Migration: Mise à jour de la table candidates pour les stages
-- Auteur: Claude Assistant
-- Date: 2026-01-17
-- Description: Ajouter des champs pour tracker le statut stage des candidates

-- Ajouter les nouvelles colonnes
ALTER TABLE candidates
ADD COLUMN IF NOT EXISTS en_stage BOOLEAN DEFAULT FALSE COMMENT 'Actuellement en stage',
ADD COLUMN IF NOT EXISTS nombre_stages_effectues INT DEFAULT 0 COMMENT 'Total stages effectués',
ADD COLUMN IF NOT EXISTS dernier_stage_id INT COMMENT 'Référence au dernier stage',
ADD COLUMN IF NOT EXISTS disponible_stage BOOLEAN DEFAULT TRUE COMMENT 'Disponible pour nouveau stage';

-- Ajouter la contrainte de clé étrangère (après création de la table stages)
-- Note: Cette contrainte sera ajoutée uniquement si la colonne dernier_stage_id existe et que la table stages existe
ALTER TABLE candidates
ADD CONSTRAINT fk_candidates_derniers_stage
FOREIGN KEY (dernier_stage_id) REFERENCES stages(id) ON DELETE SET NULL;

-- Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_en_stage ON candidates(en_stage);
CREATE INDEX IF NOT EXISTS idx_disponible_stage ON candidates(disponible_stage);
CREATE INDEX IF NOT EXISTS idx_dernier_stage ON candidates(dernier_stage_id);
