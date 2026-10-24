const express = require("express")
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const { sendProblem } = require('../utils/error')
const db = require('../config/db');
const { hashApiKey } = require("../utils/apiKey");



router.post('/', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];
        
        
        if (!apiKey || typeof apiKey !== 'string') {
            return sendProblem(res, 401, 'Unauthorized', 'Niepoprawy klucz api');
        }
        const apiKeyHash = hashApiKey(apiKey)
        const query = `SELECT sensors.id, sensors.series_id, series.min_value, series.max_value 
                       FROM sensors JOIN series ON series.id = sensors.series_id WHERE sensors.api_key_hash = $1`

        const result = await db.query(query, [apiKeyHash])

        if (result.rowCount === 0) {
            return sendProblem(res, 401, 'Unauthorized', 'Niepoprawy klucz api');
        }
        const { id, series_id, min_value, max_value } = result.rows[0];
        const { value, timestamp } = req.body || {};


        let timestampDate = new Date()
        if (!timestamp) {
            timestampDate = Date.now()
        } else {
            timestampDate = new Date(timestamp).getTime();
            if (Date.now() - timestampDate < 5 * 60 * 1000) {
               return sendProblem(res, 422, 'Unprocessable Entity', 'Wartość spoza zakresu');
            }
        }
        console.log(new Date(timestampDate).toISOString())
        if (value < min_value || value > max_value) {
            return sendProblem(res, 422, 'Unprocessable Entity', 'Wartość spoza zakresu');
        }

        const query2 = `INSERT INTO measurements (measurement_value, series_id, sensor_id, measurement_timestamp) 
        VALUES ($1, $2, $3, $4) RETURNING *`
        const result2 = await db.query(query2, [value, series_id, id, new Date(timestampDate).toISOString()]);

        if (result2.rowCount === 0) {
            return sendProblem(res, 500, 'Internal Server Error', 'Błąd serwera 1');
        }

        const measurement = result2.rows[0];

        const body = {
            "id": measurement.id,
            "seriesId": measurement.series_id,
            "sensorId": measurement.sensor_id,
            "value": measurement.measurement_value,
            "timestamp": measurement.measurement_timestamp
        }

        res.setHeader('Location', `/api/measurement/${measurement.id}`)
        res.status(201).json(body);

    } catch (err) {
        console.error('Błąd:', err);
        return sendProblem(res, 500, 'Internal Server Error', 'Błąd serwera2');
    }

})





module.exports = router;