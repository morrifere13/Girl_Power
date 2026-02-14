-- Script de suppression des données des tables candidat, projet, centre, cohorte
-- Date: 2026-01-24
-- Description: Supprime toutes les données en respectant l'ordre des contraintes de clés étrangères

USE girl_power_db;

-- Désactiver temporairement les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Supprimer les données des tables enfants (dépendent de candidates)
TRUNCATE TABLE enfants;

-- 2. Supprimer les données des candidates
TRUNCATE TABLE candidates;

-- 3. Supprimer les données des tables de liaison
TRUNCATE TABLE project_centres;

-- 4. Supprimer les données des cohortes
TRUNCATE TABLE cohortes;

-- 5. Supprimer les données des projets
TRUNCATE TABLE projects;

-- 6. Supprimer les données des métiers de centres
TRUNCATE TABLE centre_metiers;

-- 7. Supprimer les données des centres
TRUNCATE TABLE centres;

-- Réactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- Afficher le résultat
SELECT 'Toutes les données ont été supprimées avec succès!' AS message;
