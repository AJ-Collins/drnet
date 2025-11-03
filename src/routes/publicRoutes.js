const router = require('express').Router();
const path = require('path');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/login.html'));
});

module.exports = router;
