const express = require('express');
const app = express();

app.get('/test', (req, res) => {
    res.json({ message: 'Server working', timestamp: new Date() });
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
});