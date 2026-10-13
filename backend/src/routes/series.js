const express = require("express")
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const { sendProblem } = require('../utils/error')
const db = require('../config/db')

router.post('/', authenticateAdmin, async (req, res) => {

    try {
        const body = req.body || {};
        const { name, minValue, maxValue, color, icon, unit } = body

        const requiredFields = ["name", "minValue", "maxValue", "color"]
        const missingFields = requiredFields.filter((field) => body[field] === undefined || body[field] === '')

        if (missingFields.length > 0) {
            const detail = `Brakujące lub puste pola: ${missingFields.join(', ')}.`
            return sendProblem(res, 400, 'Bad Request', detail)
        }

        if (typeof minValue !== 'number' || typeof maxValue !== 'number'
            || Number.isNaN(minValue) || Number.isNaN(maxValue)
            || typeof name !== 'string' || typeof color !== 'string' ||
            (icon !== undefined && typeof icon !== 'string')
            || (unit !== undefined && typeof unit !== 'string')) {
            return sendProblem(res, 400, 'Bad Request', 'Nieprawidłowe typy pól')
        }

        const regex = /^#[0-9A-Fa-f]{6}$/
        const isColorValid = regex.test(color)

        const details = []

        if (name.length > 100) {
            details.push('Nazwa serii przekracza 100 znaków')

        }

        if (minValue >= maxValue) {
            details.push('Minimalna wartość musi być ściśle mniejsza od maksymalnej')
        }

        if (!isColorValid) {
            details.push('Niepoprawny kolor')
        }

        if (icon !== undefined && icon.length > 20) {
            details.push('Nazwa ikony przekracza 20 znaków')
        }

        if (unit !== undefined && unit.length > 20) {
            details.push('Nazwa jednostki przekracza 20 znaków')
        }

        if (details.length > 0) {
            const detail = details.join(', ')
            return sendProblem(res, 422, 'Unprocessable Entity', detail);
        }

        const fIcon = icon ?? '' 
        const fUnit = unit ?? '' 

        const query = `INSERT INTO series (series_name, min_value, max_value, 
        color, icon, unit) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`
        const result = await db.query(query, [name, minValue, maxValue, color, fIcon, fUnit])

        if (result.rowCount === 0) {
            return sendProblem(res, 500, 'Internal Server Error', 'Nie udało się utworzyć serii :)');
        }

        const serie = result.rows[0]

        const responseBody = {
            "name": serie.series_name,
            "minValue": parseFloat(serie.min_value),
            "maxValue": parseFloat(serie.max_value),
            "color": serie.color,
            "icon": serie.icon,
            "unit": serie.unit,
            "id": serie.id
        }

       res.setHeader('Location',`/api/series/${serie.id}`)
       return res.status(201).json(responseBody)

    } catch (err) {
        console.error('Błąd:', err);
        return sendProblem(res, 500, 'Internal Server Error', 'Błąd serwera');
    }

})

module.exports = router