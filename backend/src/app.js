const express = require('express');
const cors = require('cors')
const authRoutes = require('./routes/auth');
const seriesRoutes = require('./routes/series');
const sensorsRoutes = require('./routes/sensors');
const measurementsRoutes = require('./routes/measurements');
const { checkContentType } = require('./middleware/contentType')
const { validateAcceptHeader } = require('./middleware/accept')
const app = express();
const { sendProblem } = require('./utils/error')

const port = process.env.PORT || 3000;


app.use(cors());
app.use(checkContentType);
app.use(validateAcceptHeader);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/sensors', sensorsRoutes);
app.use('/api/measurements', measurementsRoutes);
app.use('/api/measurement', measurementsRoutes);
app.get('/api/health',(req, res) => {res.json({ status: 'ok' });});



app.use((req, res) => {
  return sendProblem(res, 404, 'Not Found', `Zasób lub metoda ${req.method} ${req.originalUrl} nie istnieje`);
}); 

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendProblem(res, 400, 'Bad Request', 'Niepoprawny format danych JSON w treści żądania');

  }
  console.error('Nieobsłużony błąd serwera:', err);
  return sendProblem(res, 500, 'Internal Server Error', 'Wystąpił nieoczekiwany błąd serwera');
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});