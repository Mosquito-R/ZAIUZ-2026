const express = require('express');
const cors = require('cors')
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const seriesRoutes = require('./routes/series');
const sensorsRoutes = require('./routes/sensors');
const measurementsRoutes = require('./routes/measurements');
const {checkContentType} = require('./middleware/contentType')
const {validateAcceptHeader} = require('./middleware/accept')
const app = express();
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(checkContentType);
app.use(validateAcceptHeader);

app.use('/auth', authRoutes);
app.use('/series', seriesRoutes);
app.use('/sensors', sensorsRoutes);
app.use('/measurements', measurementsRoutes);
app.use('/measurement', measurementsRoutes);

app.get('/health', async (req, res) => {
  try {
    res.json({ status: 'ok'});
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});