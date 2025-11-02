const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

let db = null;

async function getDB() {
    if (!db) {
        db = await open({
            filename: './drnet.db',
            driver: sqlite3.Database
        });
    }
    return db;
}

// Convert MySQL queries to SQLite
const pool = {
    async execute(query, params = []) {
        const database = await getDB();
        
        // Convert MySQL syntax to SQLite
        let sqliteQuery = query
            .replace(/AUTO_INCREMENT/g, 'AUTOINCREMENT')
            .replace(/MEDIUMTEXT/g, 'TEXT')
            .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/g, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
            .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/g, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
            .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/g, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
            .replace(/BOOLEAN/g, 'INTEGER')
            .replace(/DECIMAL\(10,2\)/g, 'REAL')
            .replace(/VARCHAR\(\d+\)/g, 'TEXT')
            .replace(/INT\s+AUTO_INCREMENT/g, 'INTEGER')
            .replace(/AUTO_INCREMENT/g, '')
            .replace(/FOREIGN KEY.*?ON DELETE.*?(?=,|\))/gs, '')
            .replace(/UNIQUE KEY.*?(?=,|\))/gs, '')
            .replace(/ENUM\([^)]+\)/g, 'TEXT')
            .replace(/NOW\(\)/g, "DATETIME('now')")
            .replace(/ON DUPLICATE KEY UPDATE.*$/g, ''); // Remove MySQL specific syntax

        // Handle different query types
        if (query.toLowerCase().includes('insert')) {
            const result = await database.run(sqliteQuery, params);
            return [{ insertId: result.lastID, affectedRows: result.changes }];
        } else if (query.toLowerCase().includes('update') || query.toLowerCase().includes('delete')) {
            const result = await database.run(sqliteQuery, params);
            return [{ affectedRows: result.changes }];
        } else {
            const result = await database.all(sqliteQuery, params);
            return [result];
        }
    },

    async query(query, params = []) {
        return this.execute(query, params);
    }
};

module.exports = pool;
