-- Base de données Girl Power
CREATE DATABASE IF NOT EXISTS girl_power_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE girl_power_db;

-- Table des candidates
CREATE TABLE IF NOT EXISTS candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    age INT,
    sexe ENUM('F', 'M') DEFAULT 'F',
    telephone VARCHAR(20),
    email VARCHAR(100),
    region VARCHAR(100) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    adresse TEXT,
    type_document ENUM('CNI', 'Extrait de naissance', 'Récépissé', 'Certificat', 'Aucun document') DEFAULT 'Aucun document',
    numero_document VARCHAR(50),
    diplome ENUM('CEPE', 'BEPC', 'BAC', 'CAP', 'BTS', 'Licence', 'Sans diplôme') DEFAULT 'Sans diplôme',
    metier_choisi VARCHAR(100),
    a_des_enfants BOOLEAN DEFAULT FALSE,
    nombre_enfants INT DEFAULT 0,
    enfants_au_centre BOOLEAN DEFAULT FALSE,
    statut ENUM('En attente', 'Acceptée', 'Refusée', 'En formation') DEFAULT 'En attente',
    photo VARCHAR(255),
    date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_region (region),
    INDEX idx_ville (ville),
    INDEX idx_metier (metier_choisi),
    INDEX idx_diplome (diplome),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des enfants
CREATE TABLE IF NOT EXISTS enfants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    date_naissance DATE,
    age INT,
    sexe ENUM('M', 'F'),
    au_centre BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    INDEX idx_candidate (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Données de test
INSERT INTO candidates (nom, prenom, date_naissance, age, region, ville, type_document, diplome, metier_choisi, a_des_enfants, nombre_enfants, enfants_au_centre) VALUES
('KOUAME', 'Aya', '2001-05-15', 23, 'NAWA', 'Soubré', 'Aucun document', 'CEPE', 'Pâtisserie - Cuisine', TRUE, 2, TRUE),
('KOFFI', 'Marie', '2003-08-20', 21, 'NAWA', 'Soubré', 'Aucun document', 'BEPC', 'Coiffure - Esthétique', FALSE, 0, FALSE),
('YAO', 'Adjoua', '1999-12-10', 25, 'GBOKLE', 'Sago', 'CNI', 'CEPE', 'Agro-pastorale', TRUE, 1, TRUE),
('KOUASSI', 'Fatou', '2005-03-25', 19, 'ABIDJAN', 'Yopougon', 'Extrait de naissance', 'Sans diplôme', 'Pâtisserie - Cuisine', FALSE, 0, FALSE),
('N''GUESSAN', 'Akissi', '2002-07-14', 22, 'SAN PEDRO', 'San Pedro', 'Récépissé', 'BEPC', 'Mécanique Auto', TRUE, 3, FALSE);

-- Données enfants
INSERT INTO enfants (candidate_id, nom, prenom, date_naissance, age, sexe, au_centre) VALUES
(1, 'KOUAME', 'Jean', '2022-01-15', 2, 'M', TRUE),
(1, 'KOUAME', 'Ange', '2023-06-20', 1, 'F', TRUE),
(3, 'YAO', 'Konan', '2023-03-10', 1, 'M', TRUE),
(5, 'KOUASSI', 'Adjoua', '2021-05-05', 3, 'F', FALSE),
(5, 'KOUASSI', 'Michel', '2022-11-20', 2, 'M', FALSE),
(5, 'KOUASSI', 'Grace', '2024-02-14', 1, 'F', FALSE);
