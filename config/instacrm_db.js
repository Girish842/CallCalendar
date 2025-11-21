var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit: 40,
    host: '162.241.126.79',
    user: 'pragya',
    password: 'mK%0f35v',
    database: 'pragya_db',
    charset: 'utf8mb4',
    connectTimeout: 20000, 
    timezone: 'Asia/Kolkata',
});

// Event for new physical connections in the pool
pool.on('connection', (connection) => {
    console.log(`New MySQL connection established as id ${connection.threadId}`);

    // Set session-specific timeouts (5 minutes)
    connection.query('SET SESSION wait_timeout = 15');
    connection.query('SET SESSION interactive_timeout = 15');
});

// Handle unexpected errors on the pool
pool.on('error', (err) => {
    console.error('Database error:', err);
});

// Test connection on startup
pool.query('SELECT 1', (err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL database pool');
});

// Cleanup idle sleepers every 1 minutes
const cleanupInterval = 30 * 1000;

setInterval(() => {
    pool.query(`
        SELECT ID
        FROM information_schema.processlist
        WHERE COMMAND = 'Sleep'
        AND TIME > 3
        AND USER = 'pragya'
        AND ID != CONNECTION_ID();
    `, (err, results) => {
        if (err) {
            console.error('Cleanup error:', err);
            return;
        }

        results.forEach(row => {
            console.log(`[Cleanup] Killing ID ${row.ID} | User: ${row.USER} | Time: ${row.TIME}s | Host: ${row.HOST}`);
            pool.query(`KILL ${row.ID}`, (killErr) => {
                if (killErr) {
                    console.error(`Failed to kill connection ${row.ID}: ${killErr.message}`);
                } else {
                    console.log(`Killed idle connection ID ${row.ID}`);
                }
            });
        });
    });
}, cleanupInterval);


// Export a helper for queries and the pool
module.exports = {
    query: (sql, params, callback) => {
        return pool.query(sql, params, callback);
    },
    pool
};