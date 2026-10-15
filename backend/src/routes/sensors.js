const express = require("express")
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const { sendProblem } = require('../utils/error')
const db = require('../config/db')
const { generateApiKey, hashApiKey } = require('../utils/apiKey')



router.get('/', authenticateAdmin, async (req, res) => {
    try {
        const query = 'SELECT id, sensor_name, series_id, created_at, last_measurement_at FROM sensors ORDER BY id ASC';
        const result = await db.query(query);
        const body = result.rows.map((row) => {
            return {
                "id": row.id,
                "name": row.sensor_name,
                "seriesId": row.series_id,
                "createdAt": row.created_at,
                "lastMeasurementAt": row.last_measurement_at
            }
        })
        return res.status(200).json(body)
    } catch (err) {
        console.error('Błąd:', err);
        return sendProblem(res, 500, 'Internal Server Error', 'Błąd serwera');
    }
})


router.get('/:sensorId',authenticateAdmin, async (req, res) => {
    try {
        const sensorId = req.params.sensorId
        const query = 'SELECT * FROM sensors WHERE id=$1';
        const result = await db.query(query,[sensorId]);

        if(result.rowCount === 0){
            return sendProblem(res, 404, 'Not Found','Nie znaleziono czujnika o podanym id')
        }

        const row = result.rows[0]
       
        const body = {
                "id": row.id,
                "name": row.sensor_name,
                "seriesId": row.series_id,
                "createdAt": row.created_at,
                "lastMeasurementAt": row.last_measurement_at
            }
        
        return res.status(200).json(body)
    } catch (err) {
        console.error('Błąd:', err);
        return sendProblem(res, 500, 'Internal Server Error', 'Błąd serwera');
    }
})


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

        const sensor = result.rows[0];

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

router.delete('/:sensorId', authenticateAdmin, async (req, res) => {
    try {
        const sensorId = req.params.sensorId;
        const query = 'DELETE FROM sensors WHERE id = $1 RETURNING id';
        const result = await db.query(query, [sensorId]);
        if (result.rowCount === 0) {
            return sendProblem(res, 404, 'Not Found', 'Nie znaleziono sensora o podanym id')
        }

        return res.status(204).send();
    } catch (err) {
        console.error('Błąd:', err);
        return sendProblem(res, 500, 'Internal Server Error', 'Błąd serwera');
    }
})

module.exports = router