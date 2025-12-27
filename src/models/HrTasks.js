const db = require("../config/db");

const HrTask = {
    // READ all tasks with their comments
    getAll: async () => {
        const [tasks] = await db.query('SELECT * FROM tasks ORDER BY created_at DESC');
        const [comments] = await db.query('SELECT * FROM comments ORDER BY time_sent ASC');
        
        return tasks.map(task => {
            let formattedDate = '';
            
            if (task.dueDate) {
                const dateObj = new Date(task.dueDate);
                if (!isNaN(dateObj.getTime())) {
                    formattedDate = dateObj.toISOString().split('T')[0];
                }
            }

            return {
                ...task,
                dueDate: formattedDate, 
                comments: comments
                    .filter(c => c.task_id === task.id)
                    .map(c => ({ 
                        text: c.text, 
                        time: c.time_sent 
                    }))
            };
        });
    },

    // CREATE a new task
    create: async (data) => {
        const { title, role, priority, owner, phone, dueDate } = data;
        const [result] = await db.query(
            'INSERT INTO tasks (title, role, priority, owner, phone, dueDate) VALUES (?, ?, ?, ?, ?, ?)',
            [title, role, priority, owner, phone, dueDate]
        );
        return { id: result.insertId, ...data, comments: [] };
    },

    // UPDATE status or priority (PATCH)
    update: async (id, updates) => {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), id];
        await db.query(`UPDATE tasks SET ${fields} WHERE id = ?`, values);
        return { id, ...updates };
    },

    // DELETE task
    delete: async (id) => {
        await db.query('DELETE FROM tasks WHERE id = ?', [id]);
        return true;
    },

    // ADD COMMENT
    addComment: async (taskId, text) => {
        await db.query('INSERT INTO comments (task_id, text) VALUES (?, ?)', [taskId, text]);

        const [task] = await db.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
        const [comments] = await db.query('SELECT * FROM comments WHERE task_id = ?', [taskId]);
        return { 
            ...task[0], 
            comments: comments.map(c => ({ text: c.text, time: c.time_sent })) 
        };
    }
};

module.exports = HrTask;