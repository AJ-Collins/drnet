const db = require("../config/db");

const HrProject = {
    // GET all projects with logistics nested
    getAllProjects: async () => {
        const [rows] = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            budget: row.budget,
            spent: row.spent,
            deadline: row.deadline,
            progress: row.progress,
            logistics: {
                transport: row.transport,
                accommodation: row.accommodation,
                deliveryStatus: row.deliveryStatus
            }
        }));
    },

    // CREATE new project
    createProject: async (data) => {
        const sql = `INSERT INTO projects (name, budget, deadline, transport, accommodation, deliveryStatus) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [data.name, data.budget, data.deadline, data.logistics.transport, data.logistics.accommodation, data.logistics.deliveryStatus];
        const [result] = await db.execute(sql, params);
        return result.insertId;
    },

    // GET all requests joined with project name
    getAllRequests: async () => {
        const sql = `SELECT r.*, p.name as projectName 
                     FROM requests r 
                     JOIN projects p ON r.project_id = p.id 
                     WHERE r.status = 'Pending Approval'`;
        const [rows] = await db.query(sql);
        return rows.map(r => ({
            id: r.id,
            item: r.item,
            project: r.projectName,
            cost: r.cost,
            qty: r.qty
        }));
    },

    // CREATE request
    createRequest: async (data) => {
        const [proj] = await db.query('SELECT * FROM projects WHERE id = ?', [data.project]);
        if (proj.length === 0) throw new Error("Project not found");

        const sql = `INSERT INTO requests (project_id, item, qty, cost) VALUES (?, ?, ?, ?)`;
        await db.execute(sql, [proj[0].id, data.item, data.qty, data.cost]);
    },

    // APPROVE request (The workflow)
    approveRequest: async (requestId) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Get request details
            const [req] = await connection.query('SELECT * FROM requests WHERE id = ?', [requestId]);
            const r = req[0];

            // 2. Move to resources table
            await connection.execute(
                'INSERT INTO resources (project_id, item, cost) VALUES (?, ?, ?)',
                [r.project_id, r.item, r.cost]
            );

            // 3. Update project 'spent' total
            await connection.execute(
                'UPDATE projects SET spent = spent + ? WHERE id = ?',
                [r.cost, r.project_id]
            );

            // 4. Update request status
            await connection.execute('UPDATE requests SET status = "Approved" WHERE id = ?', [requestId]);

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    // GET all resources
    getResources: async () => {
        const sql = `SELECT r.*, p.name as projectName FROM resources r JOIN projects p ON r.project_id = p.id`;
        const [rows] = await db.query(sql);
        return rows.map(row => ({
            item: row.item,
            project: row.projectName,
            status: row.status,
            cost: row.cost
        }));
    },
    updateProject: async (id, data) => {
        const { progress, logistics } = data;
        const sql = `
            UPDATE projects 
            SET 
                progress = ?, 
                transport = ?, 
                accommodation = ?, 
                deliveryStatus = ? 
            WHERE id = ?
        `;
        const params = [
            progress,
            logistics.transport,
            logistics.accommodation,
            logistics.deliveryStatus,
            id
        ];
        
        const [result] = await db.execute(sql, params);
        return result.affectedRows > 0;
    }
};

module.exports = HrProject;