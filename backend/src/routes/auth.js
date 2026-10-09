const {SignJWT} = require("jose");
const argon2 = require("argon2");
const express = require('express');
const db = require('../config/db');
const router = express.Router()

router.post('/login', async(req, res) =>{

    try{
        const {username,password}= req.body;
        if( !username || !password){
            return res.status(400).json({message: "Brak loginu lub hasła"})
        }
        const result = await db.query('SELECT id, password_hash FROM admins WHERE username = $1', [username]);


        const admin = result.rows[0]

        if (!admin) {
            return res.status(401).json({ message: 'Hasło nieprawidłowe lub użytkownik nie istnieje!' });
        }
        
        const passwordValid = await argon2.verify(admin.password_hash, password)

        if (passwordValid) {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET)
            const jwt = await new SignJWT({id: admin.id, username: username })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(secret);   

            return res.json({
                accessToken : jwt, 
                tokenType: "Bearer", 
                expiresIn : 3600})
        }else{
            return res.status(401).json({ message: 'Hasło nieprawidłowe lub użytkownik nie istnieje!' });
        }
        
        
        
    }catch(err){
       console.error('Błąd logowania:', err);
       return res.status(500).json({message: "Błąd serwera!"})
    }
    
})

module.exports = router