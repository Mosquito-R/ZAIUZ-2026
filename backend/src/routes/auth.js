const { SignJWT } = require("jose");
const argon2 = require("argon2");
const express = require('express');
const crypto = require('crypto');
const db = require('../config/db');
const { sendProblem } = require('../utils/error')
const router = express.Router()
const { authenticateAdmin, invalidateToken } = require('../middleware/auth.js')
const DUMMY_HASH = '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RdescudvJCsgqlfreSAeVoScLeaq4HHbgHJaYBgkBgQ';

router.post('/login', async (req, res) => {

    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return sendProblem(
                res,
                400,
                'Bad Request',
                'Wymagana nazwa użytkownika oraz hasło'
            );
        }
        const result = await db.query('SELECT id, password_hash FROM admins WHERE username = $1', [username]);


        const admin = result.rows[0]

        const hashToVerify = admin ? admin.password_hash : DUMMY_HASH;
        const passwordValid = await argon2.verify(admin.password_hash, password)

        if (!admin || !passwordValid) {
            return sendProblem(
                res,
                401,
                'Unauthorized',
                'Hasło nieprawidłowe lub użytkownik nie istnieje!'
            );
        }



        const secret = new TextEncoder().encode(process.env.JWT_SECRET)
        const jwt = await new SignJWT({ id: admin.id, username: username })
            .setProtectedHeader({ alg: 'HS256' })
            .setJti(crypto.randomUUID())
            .setIssuedAt()
            .setExpirationTime('15m')
            .sign(secret);

        res.cookie('auth_token', jwt, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 900000, // 15 min
            path: '/'
        });

        const isSpaClient = req.headers['x-requested-with'] === 'XMLHttpRequest'
            || req.headers['x-client'] === 'spa';

        if (isSpaClient) {

            return res.status(200).json({
                status: "ok",
                expiresIn: 3600
            });
        }

        return res.status(200).json({
            accessToken: jwt,
            tokenType: "Bearer",
            expiresIn: 900
        })




    } catch (err) {
        console.error('Błąd logowania:', err);
        return sendProblem(res, 500, 'Internal Server Error', 'Błąd serwera');
    }

})

router.post('/logout', authenticateAdmin, async (req, res) => {
    const authHeader = req.headers['authorization'];
    let jwt = authHeader && authHeader.split(' ')[1];
    invalidateToken(jwt)
    if (jwt) {
        invalidateToken(jwt);
    }
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/'
    });
    return res.status(204).send();
})

router.put('/password', authenticateAdmin, async (req, res) => {


    try {
        const { currentPassword, newPassword } = req.body;
        const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

        if (!currentPassword || !newPassword) {
            return sendProblem(res, 400, 'Bad Request', 'Wymagane hasło oraz nowe hasło');
        }

        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
            return sendProblem(res, 400, 'Bad Request', 'Hasła muszą być ciągami znaków');
        }

        if (!passwordComplexityRegex.test(newPassword)) {
            return sendProblem(res, 422, 'Unprocessable Entity', 'Nowe hasło musi zawierać co najmniej jedną wielką literę, małą literę, cyfrę oraz znak specjalny');
        }

        if (currentPassword === newPassword) {
            return sendProblem(res, 422, 'Unprocessable Entity', 'Nowe hasło musi różnić się od dotychczasowego');
        }

        const adminId = req.user?.id

        if (!adminId) {
            return sendProblem(res, 401, 'Unauthorized', 'Brak identyfikatora użytkownika');
        }

        const query = 'SELECT password_hash FROM admins WHERE id = $1'
        const result = await db.query(query, [adminId])

        if (result.rowCount === 0) {
            return sendProblem(res, 404, 'Not Found', 'Użytkownik nie istnieje');
        }

        const currentPasswordHash = result.rows[0].password_hash;
        const isPasswordValid = await argon2.verify(currentPasswordHash, currentPassword);

        if (!isPasswordValid) {
            return sendProblem(res, 403, 'Forbidden', 'Błędne bieżące hasło');
        }

        const newPasswordHash = await argon2.hash(newPassword, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4
        })


        const query2 = 'UPDATE admins SET password_hash = $1 WHERE id = $2'
        const result2 = await db.query(query2, [newPasswordHash, adminId])

        if (result2.rowCount === 0) {
            return sendProblem(res, 500, 'Internal Server Error', 'Nie udało się zaktualizować hasła');
        }

        const currentAuthHeader = req.headers['authorization'];
        if (currentAuthHeader) {
            const currentJwt = currentAuthHeader.split(' ')[1];
            invalidateToken(currentJwt);
        }
        return res.status(204).send();


    } catch (err) {
        console.error('Błąd:', err);
        return sendProblem(res, 500, 'Internal Server Error', 'Błąd serwera');
    }
})

module.exports = router