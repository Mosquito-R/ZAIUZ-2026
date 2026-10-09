const { jwtVerify } =  require("Jose");



const authenticateAdmin = async(req, res, next) =>{
    
    const jwt = req.headers['authorization'].split(' ')[1];
    if(!jwt){
       res.status(401).json({message:"no token!"})
       return
    }

    try{
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(jwt, secret)
        req.user = payload
        next()
    }catch(err){
        return res.status(403).json({ message: 'Nieprawidłowy lub przeterminowany token' });
    }    
};



module.exports = authenticateAdmin