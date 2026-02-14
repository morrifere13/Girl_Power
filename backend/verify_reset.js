const db = require('./config/db');

async function verify() {
    try {
        const [users] = await db.query('SELECT COUNT(*) as count FROM users');
        const [locations] = await db.query('SELECT COUNT(*) as count FROM locations');
        const [candidates] = await db.query('SELECT COUNT(*) as count FROM candidates');

        console.log('--- Verification ---');
        console.log(`Users count: ${users[0].count} (Should be > 0)`);
        console.log(`Locations count: ${locations[0].count} (Should be > 0)`);
        console.log(`Candidates count: ${candidates[0].count} (Should be 0)`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
verify();
