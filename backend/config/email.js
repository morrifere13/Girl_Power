const nodemailer = require('nodemailer');

// Configuration Ethereal pour le développement
// En production, utiliser des variables d'environnement (GMAIL_USER, GMAIL_PASS, etc.)
const createTransporter = async () => {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });

    console.log('📧 Service email configuré avec Ethereal Mail');
    console.log('User:', testAccount.user);
    console.log('Pass:', testAccount.pass);

    return transporter;
};

module.exports = createTransporter;
