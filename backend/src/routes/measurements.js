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
        return sendProblem(res, 500, 'Internal Server Error', 'Błąd serwera');
    }

})


router.get('/:measurementId', async (req, res) => {
    try {
        const measurementId = req.params.measurementId
        const query = 'SELECT * FROM measurements WHERE id=$1';
        const result = await db.query(query, [measurementId]);

        if (result.rowCount === 0) {
            return sendProblem(res, 404, 'Not Found', 'Nie znaleziono pomiaru o podanym id')
        }

        const row = result.rows[0]

        const body = {
            "id": row.id,
            "seriesId": row.series_id,
            "sensorId": row.sensor_id,
            "value": row.measurement_value,
            "timestamp": row.measurement_timestamp
        }

        return res.status(200).json(body)

    } catch (err) {
        console.error('Błąd:', err);
        return sendProblem(res, 500, 'Internal Server Error', 'Błąd serwera');
    }
})

router.get('/', async (req, res) => {
    try {
        const {series, from, to, sort = "timestamp", limit = 1000} = req.query

        const whereClauses = [];
        const queryParams = [];
        let paramIndex = 1;

        if (series !== undefined && series !== '') {
            const seriesIds = series.split(',').map(id => parseInt(id.trim(), 10));
            
            if (seriesIds.some(id => Number.isNaN(id) || id <= 0)) {
                return sendProblem(res, 400, 'Bad Request', 'Parametr "series" musi zawierać liczby całkowite rozdzielone przecinkami');
            }

            whereClauses.push(`series_id = ANY($${paramIndex})`);
            queryParams.push(seriesIds);
            paramIndex++;
        }

        if (from !== undefined && from !== ''){
            const fromDate = new Date(from);
            if (Number.isNaN(fromDate.getTime())) {
                return sendProblem(res, 400, 'Bad Request', 'Niepoprawny format parametru "from"');
            }
            whereClauses.push(`measurement_timestamp >= $${paramIndex}`);
            queryParams.push(fromDate.toISOString());
            paramIndex++;
        }

        if (to !== undefined && from !== ''){
            const toDate = new Date(to);
            if (Number.isNaN(toDate.getTime())) {
                return sendProblem(res, 400, 'Bad Request', 'Niepoprawny format parametru "to"');
            }
            whereClauses.push(`measurement_timestamp <= $${paramIndex}`);
            queryParams.push(toDate.toISOString());
            paramIndex++;
        }
        
        if (sort !== 'timestamp' && sort !== '-timestamp'){
            return sendProblem(res, 400, 'Bad Request', 'Niepoprawny format parametru "sort"');
        }

        const sortDirection = sort === 'timestamp' ? 'ASC' : 'DESC';

        const parsedLimit = parseInt(limit, 10);
        if (Number.isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 10000) {
            return sendProblem(res, 400, 'Bad Request', 'Niepoprawny format parametru "limit"');
        }
        let query = `
            SELECT id, measurement_value, series_id, sensor_id, measurement_timestamp
            FROM measurements
        `;

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        query += ` ORDER BY measurement_timestamp ${sortDirection}`;
        query += ` LIMIT $${paramIndex}`;
        queryParams.push(parsedLimit);

        const result = await db.query(query, queryParams);

        const body = result.rows.map(row => ({
            id: row.id,
            value: parseFloat(row.measurement_value),
            seriesId: row.series_id,
            sensorId: row.sensor_id,
            timestamp: new Date(row.measurement_timestamp).toISOString()
        }));

        return res.status(200).json(body)

    } catch (err) {
        console.error('Błąd:', err);
        return sendProblem(res, 500, 'Internal Server Error', 'Błąd serwera');
    }
})


module.exports = router;