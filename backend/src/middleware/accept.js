const { sendProblem } = require('../utils/error');


const validateAcceptHeader = (req, res, next) => {
    const acceptHeader = req.headers['accept'];

   
    if (!acceptHeader || acceptHeader === '*/*' || acceptHeader.includes('*/*')) {
        return next();
    }


    const isJsonAccepted = acceptHeader.includes('application/json') ||
        acceptHeader.includes('application/problem+json');

    if (!isJsonAccepted) {
        return sendProblem(
            res,
            406,
            'Not Acceptable',
            'Serwer obsługuje wyłącznie odpowiedzi w formacie application/json'
        );
    }

    next();
};

module.exports = { validateAcceptHeader };