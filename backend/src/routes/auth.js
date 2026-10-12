const { SignJWT, decodeJwt } = require("jose");
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

router.put('/password', authenticateAdmin, async (req, res) => {


    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return sendProblem(res, 400, 'Bad Request', 'Wymagane hasło oraz nowe hasło');
        }

        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' ){
            return sendProblem(res, 400, 'Bad Request', 'Hasła muszą być ciągami znaków');
        }

        if (newPassword.length < 8) {
            return sendProblem(res, 422, 'Unprocessable Entity', 'Hasło musi być ciągiem znaków o długości co najmniej 8');
        }

        const adminId = req.user?.id

        if (!adminId) {
            return sendProblem(res, 401, 'Unauthorized', 'Brak identyfikatora użytkownika');
        }

        const query = 'SELECT password_hash FROM admins WHERE id = $1'
        const result = await db.query(query, [adminId])

        if (result.rowCount === 0){
            return sendProblem(res, 404, 'Not Found', 'Użytkownik nie istnieje');
        }

        const currentPasswordHash = result.rows[0].password_hash;
        const isPasswordValid = await argon2.verify(currentPasswordHash, currentPassword);

        if (!isPasswordValid) {
            return sendProblem(res, 403, 'Forbidden', 'Błędne bieżące hasło');
        }

        const newPasswordHash = await argon2.hash(newPassword)

        const query2 = 'UPDATE admins SET password_hash = $1 WHERE id = $2'
        const result2 = await db.query(query2, [newPasswordHash, adminId ])

        if (result2.rowCount === 0) {
            return sendProblem(res, 500, 'Internal Server Error', 'Nie udało się zaktualizować hasła');
        }

        return res.status(204).send();


    } catch (err) {
        console.error('Błąd:', err);
        return sendProblem(res, 500, 'Internal Server Error', 'Błąd serwera');
    }
})

module.exports = router