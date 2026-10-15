const { sendProblem } = require('../utils/error');


const checkContentType = (req, res, next) => {

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const contentType = req.headers['content-type']

        if (contentType  !== undefined && !contentType.toLowerCase().includes('application/json')) {
            return sendProblem(
                res,
                415,
                'Unsupported Media Type',
                'Tresc zadania w nieobslugiwanym formacie. Wymagany format: application/json'
            );
        }
    }

    next();

}

module.exports = {checkContentType}