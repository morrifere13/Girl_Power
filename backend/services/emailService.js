const createTransporter = require('../config/email');
const nodemailer = require('nodemailer');

let transporter = null;

// Initialize transporter
(async () => {
    try {
        transporter = await createTransporter();
    } catch (error) {
        console.error('Failed to initialize email service:', error);
    }
})();

/**
 * Envoie un email générique
 */
const sendEmail = async (to, subject, html) => {
    if (!transporter) {
        console.error('Email service not initialized');
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: '"Girl Power Admin" <admin@girlpower.org>',
            to,
            subject,
            html,
        });

        console.log("Message sent: %s", info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

/**
 * Envoie un email de bienvenue à une nouvelle candidate
 */
const sendWelcomeEmail = async (candidate) => {
    if (!candidate.email) return;

    const subject = "Bienvenue chez Girl Power !";
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #db2777;">Bienvenue, ${candidate.prenom} !</h1>
            <p>Bonjour ${candidate.prenom} ${candidate.nom},</p>
            <p>Nous sommes ravis de vous confirmer votre inscription au programme Girl Power.</p>
            <p>Votre dossier est actuellement : <strong>${candidate.statut}</strong></p>
            <hr>
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            <p style="font-size: 12px; color: #666;">Ceci est un message automatique, merci de ne pas y répondre.</p>
        </div>
    `;

    return await sendEmail(candidate.email, subject, html);
};

/**
 * Envoie un email de notification lors d'un changement de statut
 */
const sendStatusUpdateEmail = async (candidate, oldStatus, newStatus) => {
    if (!candidate.email) return;

    const subject = "Mise à jour de votre statut - Girl Power";
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #db2777;">Mise à jour de votre dossier</h1>
            <p>Bonjour ${candidate.prenom},</p>
            <p>Le statut de votre dossier a changé :</p>
            <p>
                Ancien statut : <span style="text-decoration: line-through; color: #666;">${oldStatus}</span><br>
                Nouveau statut : <strong style="color: #db2777; font-size: 18px;">${newStatus}</strong>
            </p>
            <p>Connectez-vous à votre espace pour plus de détails ou contactez votre référent.</p>
            <hr>
            <p style="font-size: 12px; color: #666;">Ceci est un message automatique.</p>
        </div>
    `;

    return await sendEmail(candidate.email, subject, html);
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendStatusUpdateEmail
};
