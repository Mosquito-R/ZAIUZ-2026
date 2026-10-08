const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});