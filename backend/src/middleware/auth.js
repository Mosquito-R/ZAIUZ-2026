const { jwtVerify, decodeJwt } = require("jose");
const { sendProblem } = require('../utils/error')

const tokenBlacklist = new Set()




const invalidateToken = (token) => {
    if (!token) return;

    tokenBlacklist.add(token)

    try {
        const payload = decodeJwt(token);
        if (payload && payload.exp) {
            const timeToLiveMs = payload.exp * 1000 - Date.now();

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
    let jwt = authHeader && authHeader.split(' ')[1];


    if (!jwt) {
        if (req.cookies && req.cookies.auth_token) {
            jwt = req.cookies.auth_token;
        } else if (req.headers.cookie) {
            const match = req.headers.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
            if (match) {
                jwt = decodeURIComponent(match[1]);
            }
        }
    }

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
        req.jwt = jwt
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

