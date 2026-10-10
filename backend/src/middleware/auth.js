const { jwtVerify, decodeJwt } = require("jose");
const { sendProblem } = require('../utils/error')

const tokenBlacklist = new Set()




const invalidateToken = (token) => {
    if (!token) return;

    tokenBlacklist.add(token)

    try {
        const payload = decodeJwt(token);
        if (payload && payload.exp) {
            const timeToLiveMs = payload.exp * 1000 - Date.Now();

            if (timeToLiveMs > 0) {
                setTimeout(() => {
                    tokenBlacklist.delete(token);
                }, timeToLiveMs)
            } else {
                tokenBlacklist.delete(token);
            }

        }
    } catch (err) {
        setTimeout(() => {
            tokenBlacklist.delete(token);
        }, 3600000)
    }
}

const authenticateAdmin = async (req, res, next) => {

    const authHeader = req.headers['authorization']
    const jwt = authHeader && authHeader.split(' ')[1];
    if (!jwt) {
        return sendProblem(
            res,
            401,
            'Unauthorized',
            'Brak lub niepoprawny token autoryzacyjny'
        );
    }

    try {
        if (tokenBlacklist.has(jwt)) {
            return sendProblem(
                res,
                401,
                'Unauthorized',
                'Nieprawidłowy lub przeterminowany token'
            );
        }
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(jwt, secret)
        req.user = payload
        next()
    } catch (err) {
        return sendProblem(
            res,
            401,
            'Unauthorized',
            'Nieprawidłowy lub przeterminowany token'
        );
    }
};



module.exports = { authenticateAdmin, invalidateToken }

