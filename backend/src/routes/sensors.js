const express = require("express")
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const { sendProblem } = require('../utils/error')
const db = require('../config/db')
const { generateApiKey, hashApiKey } = require('../utils/apiKey')

router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { name, seriesId } = req.body || {}
        if (!name || seriesId === undefined || typeof seriesId !== 'number' || Number.isNaN(seriesId)) {
            return sendProblem(res, 400, 'Bad Request', 'Niepoprawne żądanie (składnia, typy, brak pól, błędne parametry')
        }

        const apiKey = generateApiKey();
        const apiKeyHash = hashApiKey(apiKey);

        const query = `INSERT INTO sensors (sensor_name, api_key_hash, series_id) 
        VALUES ($1,$2,$3) RETURNING id, sensor_name, last_measurement_at, created_at, series_id`
        const result = await db.query(query, [name, apiKeyHash, seriesId])

        if (result.rowCount === 0) {
            return sendProblem(res, 500, 'Internal Server Error', 'Błąd serwera');
        }

        const sensor  = result.rows[0];

        const body = {
            "id": sensor.id,
            "name": sensor.sensor_name,
            "seriesId": sensor.series_id,
            "createdAt": sensor.created_at,
            "lastMeasurementAt": sensor.last_measurement_at,
            "apiKey": apiKey
        }

        res.setHeader('Location', `/api/sensors/${sensor.id}`);
        return res.status(201).json(body);

    } catch (err) {
        console.error('Błąd:', err);

        if (err.code === '23503') {
            return sendProblem(res, 422, 'Unprocessable Entity', 'Wskazana seria pomiarowa nie istnieje');
        }

        return sendProblem(res, 500, 'Internal Server Error', 'Błąd serwera');
    }

})

module.exports = router