const { SignJWT } = require("jose");
const argon2 = require("argon2");
const express = require('express');
const db = require('../config/db');
const { sendProblem } = require('../utils/error.js')
const router = express.Router()
const { authenticateAdmin, invalidateToken } = require('../middleware/auth.js')

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

        if (!admin) {
            return sendProblem(
                res,
                401,
                'Unauthorized',
                'Hasło nieprawidłowe lub użytkownik nie istnieje!'
            );
        }

        const passwordValid = await argon2.verify(admin.password_hash, password)

        if (passwordValid) {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET)
            const jwt = await new SignJWT({ id: admin.id, username: username })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('1h')
                .sign(secret);

            return res.status(200).json({
                accessToken: jwt,
                tokenType: "Bearer",
                expiresIn: 3600
            })
        } else {
            return sendProblem(
                res,
                401,
                'Unauthorized',
                'Hasło nieprawidłowe lub użytkownik nie istnieje!'
            );
        }



    } catch (err) {
        console.error('Błąd logowania:', err);
        return sendProblem(res, 500, 'Internal Server Error', 'Błąd serwera');
    }

})

router.post('/logout', authenticateAdmin, async (req, res) => {
    const jwt = req.headers['authorization'].split(' ')[1];
    invalidateToken(jwt)
    return res.status(204).send();
})



module.exports = router