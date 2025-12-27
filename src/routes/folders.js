const express = require('express');
const router = express.Router();
const Hub = require('../models/Folders');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const category = req.body.category || 'general';
        const uploadPath = path.join('uploads', category);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});


// GET DATA
router.get('/folders', async (req, res) => {
    const [rows] = await Hub.getFolders();
    res.json(rows.map(f => ({ ...f, isOpen: !!f.isOpen })));
});

router.get('/documents', async (req, res) => {
    try {
        const docs = await Hub.getAllDocs();
        const formatted = docs.map(d => ({
            ...d,
            versions: (typeof d.versions === 'string' ? JSON.parse(d.versions) : d.versions) || [],
            attachments: (typeof d.attachments === 'string' ? JSON.parse(d.attachments) : d.attachments) || [],
            content: { highlights: d.highlights, challenges: d.challenges, nextSteps: d.nextSteps }
        }));
        res.json(formatted);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// CREATE
router.post('/folders', async (req, res) => {
    await Hub.createFolder(req.body);
    res.sendStatus(201);
});

router.post('/documents', upload.array('file', 10), async (req, res) => {
    try {
        const { category, name } = req.body;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const results = [];

        for (const file of req.files) {
            const docData = {
                name: name || file.originalname,
                category: category,
                file_path: `${category}/${file.filename}`,
                isManual: false,
                versions: JSON.stringify([{ 
                    note: "Bulk Upload",
                    v: 1,
                    date: new Date().toLocaleDateString()
                }])
            };
            
            const id = await Hub.createDocument(docData);
            results.push({id, filename: file.originalname});
        }

        res.status(201).json({ 
            message: "Files uploaded successfully", 
            count: results.length,
            files: results 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/documents/manual - Create manual report
router.post('/documents/manual', async (req, res) => {
    try {
        const {
            name,
            category,
            content = {},
            attachments = [],
            project_ref
        } = req.body;

        if (!name || !category || !content?.highlights) {
            return res.status(400).json({
                error: "Name, category, and highlights are required"
            });
        }

        const docData = {
            name,
            category,
            isManual: true,
            project_ref: project_ref || null,
            content: {                       
                highlights: content.highlights,
                challenges: content.challenges || null,
                nextSteps: content.nextSteps || null
            },
            file_path: null,
            versions: JSON.stringify([{
                v: 1,
                date: new Date().toLocaleDateString(),
                note: "Manually Prepared Report"
            }]),
            attachments 
        };

        const newId = await Hub.createDocument(docData);

        res.status(201).json({
            success: true,
            message: "Manual report created successfully",
            id: newId,
            name
        });

    } catch (err) {
        console.error("Manual report creation error:", err);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE & DELETE
router.put('/documents/:id', async (req, res) => {
    await Hub.renameDocument(req.params.id, req.body.name);
    res.sendStatus(200);
});

router.delete('/documents/:id', async (req, res) => {
    await Hub.deleteDocument(req.params.id);
    res.sendStatus(200);
});

// UPDATE FOLDER (Rename or Toggle Open State)
router.put('/folders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, isOpen } = req.body;

        // Ensure we pass the data to the model
        const [result] = await Hub.updateFolder(id, { name, isOpen });

        if (result.affectedRows > 0) {
            res.json({ message: "Folder updated successfully" });
        } else {
            res.status(404).json({ error: "Folder not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE FOLDER
router.delete('/folders/:id', async (req, res) => {
    try {
        const [result] = await Hub.deleteFolder(req.params.id);
        if (result.affectedRows > 0) {
            res.json({ message: "Folder deleted" });
        } else {
            res.status(404).json({ error: "Folder not found" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/documents/:id/download', async (req, res) => {
    try {
        const { id } = req.params;
        
        const doc = await Hub.getDocumentById(id);
        
        if(!doc) {
            return res.status(404).json({ error: "Document not found" });
        }
        
        if (doc.isManual) {
            return res.status(400).json({ error: "Manual reports cannot be downloaded" });
        }
        
        if (!doc.file_path) {
            return res.status(404).json({ error: "File path not found" });
        }
        
        const filePath = path.join(process.cwd(), 'uploads', doc.file_path);
        
        if (!fs.existsSync(filePath)) {
            console.error("Path searched:", filePath);
            return res.status(404).json({ error: "File not found on server" });
        }

        const stat = fs.statSync(filePath);
        const fileName = path.basename(filePath);
        const fileExt = path.extname(filePath);
        
        const contentTypes = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.txt': 'text/plain',
            '.zip': 'application/zip'
        };
        
        const contentType = contentTypes[fileExt.toLowerCase()] || 'application/octet-stream';
        
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stat.size);
        
        const fileStream = fs.createReadStream(filePath);
        
        fileStream.on('error', (err) => {
            console.error('File stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: "Error reading file" });
            }
        });
        
        fileStream.pipe(res);
        
    } catch (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: "Download failed" });
    }
});

module.exports = router;