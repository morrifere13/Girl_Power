/**
 * Script de génération d'icônes PWA pour Girl Power
 * Utilise Canvas pour créer des icônes PNG
 */

const fs = require('fs');
const { createCanvas } = require('canvas');

// Couleurs Girl Power
const PRIMARY_COLOR = '#e04f65';
const BG_COLOR = '#ffffff';

function generateIcon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background rose Girl Power
    ctx.fillStyle = PRIMARY_COLOR;
    ctx.fillRect(0, 0, size, size);

    // Texte "GP" au centre
    ctx.fillStyle = BG_COLOR;
    ctx.font = `bold ${size * 0.35}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GP', size / 2, size / 2);

    // Cercle décoratif
    ctx.strokeStyle = BG_COLOR;
    ctx.lineWidth = size * 0.03;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.42, 0, 2 * Math.PI);
    ctx.stroke();

    // Sauvegarder
    const buffer = canvas.toBuffer('image/png');
    const outputPath = `./public/${filename}`;
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Icône générée: ${outputPath} (${size}x${size})`);
}

console.log('🎨 Génération des icônes PWA Girl Power...\n');

try {
    // Vérifier si canvas est installé
    require('canvas');

    generateIcon(192, 'pwa-192x192.png');
    generateIcon(512, 'pwa-512x512.png');
    generateIcon(180, 'apple-touch-icon.png');

    console.log('\n🎉 Toutes les icônes ont été générées avec succès!');
    console.log('📁 Emplacement: frontend/public/\n');
} catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
        console.log('⚠️  Le module "canvas" n\'est pas installé.');
        console.log('Installation...\n');

        const { execSync } = require('child_process');
        try {
            execSync('npm install --save-dev canvas', { stdio: 'inherit' });
            console.log('\n✅ Installation terminée. Relancez le script:\n');
            console.log('   node generate-icons.js\n');
        } catch (installError) {
            console.log('\n❌ Erreur d\'installation du module canvas.');
            console.log('Solution alternative:');
            console.log('1. Ouvrez: frontend/public/create-pwa-icons.html dans un navigateur');
            console.log('2. Cliquez droit sur chaque canvas → "Enregistrer l\'image sous..."');
            console.log('3. Nommez: pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png\n');
        }
    } else {
        console.error('❌ Erreur:', error.message);
    }
}
