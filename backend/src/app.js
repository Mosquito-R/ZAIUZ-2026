const express = require('express');
const cors = require('cors')
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const app = express();
const port = process.env.PORT || 3000;


app.use(cors())
app.use(express.json());


app.use('/auth', authRoutes);

app.get('/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ status: 'ok', db_time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});