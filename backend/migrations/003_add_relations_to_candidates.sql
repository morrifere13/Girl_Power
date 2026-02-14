-- Migration: Ajouter les relations centre_id, projet_id, cohorte_id à la table candidates
-- Date: 2026-01-17
-- Description: Permet de lier chaque candidate à UN centre, UN projet et UNE cohorte

-- Ajouter les colonnes de relation
ALTER TABLE candidates
ADD COLUMN centre_id INT NULL AFTER statut,
ADD COLUMN projet_id INT NULL AFTER centre_id,
ADD COLUMN cohorte_id INT NULL AFTER projet_id;

-- Ajouter les contraintes de clés étrangères
ALTER TABLE candidates
ADD CONSTRAINT fk_candidates_centre FOREIGN KEY (centre_id) REFERENCES centres(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_candidates_projet FOREIGN KEY (projet_id) REFERENCES projects(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_candidates_cohorte FOREIGN KEY (cohorte_id) REFERENCES cohortes(id) ON DELETE SET NULL;

-- Ajouter des index pour améliorer les performances
CREATE INDEX idx_candidates_centre ON candidates(centre_id);
CREATE INDEX idx_candidates_projet ON candidates(projet_id);
CREATE INDEX idx_candidates_cohorte ON candidates(cohorte_id);
