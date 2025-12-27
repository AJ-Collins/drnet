const db = require('../config/db');


const Folders = {
    // FOLDERS
    getFolders: () => db.execute('SELECT * FROM folders ORDER BY created_at ASC'),
    createFolder: (f) => db.execute('INSERT INTO folders (id, name, icon, isOpen) VALUES (?, ?, ?, ?)', [f.id, f.name, f.icon, f.isOpen]),
    updateFolder: (id, data) => {
        const name = data.name || "Untitled Folder";
        const isOpen = data.isOpen === true || data.isOpen === 1 ? 1 : 0;

        return db.execute(
            'UPDATE folders SET name = ?, isOpen = ? WHERE id = ?', 
            [name, isOpen, id]
        );
    },
    deleteFolder: (id) => db.execute('DELETE FROM folders WHERE id = ?', [id]),

    // DOCUMENTS & REPORTS
    getAllDocs: async () => {
        const [rows] = await db.execute(`
            SELECT d.*, 
            (SELECT JSON_ARRAYAGG(JSON_OBJECT('v', version_number, 'date', date_created, 'note', note)) 
             FROM document_versions WHERE document_id = d.id) as versions,
            (SELECT JSON_ARRAYAGG(document_id) 
             FROM report_attachments WHERE report_id = d.id) as attachments
            FROM documents d ORDER BY d.created_at DESC`);
        return rows;
    },

    getDocumentById: async (id) => {
        const [rows] = await db.execute('SELECT * FROM documents WHERE id = ?', [id]);
        return rows.length > 0 ? rows[0] : null;
    },

    createDocument: async (data) => {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            
            // 1. Insert Document
            const [res] = await conn.execute(
                `INSERT INTO documents (name, category, isManual, project_ref, highlights, challenges, nextSteps, file_path) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [data.name, data.category, data.isManual || false, data.project_ref || null, 
                 data.content?.highlights || null, data.content?.challenges || null, data.content?.nextSteps || null, data.file_path || null]
            );
            const docId = res.insertId;

            // 2. Insert Initial Version
            const versionsList = typeof data.versions === 'string' ? JSON.parse(data.versions) : data.versions;
            if (versionsList && versionsList.length > 0) {
                await conn.execute(
                    'INSERT INTO document_versions (document_id, version_number, note, date_created) VALUES (?, ?, ?, NOW())',
                    [docId, 1, versionsList[0].note]
                );
            }

            // 3. Insert Attachments (if Manual Report)
            if (data.attachments && data.attachments.length > 0) {
                const values = data.attachments.map(attId => [docId, attId]);
                await conn.query('INSERT INTO report_attachments (report_id, document_id) VALUES ?', [values]);
            }

            await conn.commit();
            return docId;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    deleteDocument: (id) => db.execute('DELETE FROM documents WHERE id = ?', [id]),
    renameDocument: (id, name) => db.execute('UPDATE documents SET name = ? WHERE id = ?', [name, id])
};

module.exports = Folders;