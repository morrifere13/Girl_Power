const db = require('./config/db');

async function checkAudit() {
    try {
        console.log('🔍 Checking Audit Logs for deleted candidates...');

        const [rows] = await db.query(`
            SELECT * FROM audit_logs 
            WHERE action = 'DELETE' AND entity_type = 'candidate' 
            ORDER BY created_at DESC 
            LIMIT 1
        `);

        if (rows.length === 0) {
            console.log('❌ No deletion logs found.');
        } else {
            console.log('✅ Found deletion log:');
            console.log('ID:', rows[0].id);
            console.log('Date:', rows[0].created_at);
            console.log('Details:', JSON.stringify(rows[0].details, null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAudit();
