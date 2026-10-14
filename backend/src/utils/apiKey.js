const crypto = require('crypto');

const generateApiKey = () =>{
    const buffer = crypto.randomBytes(32);
    return `s-${buffer.toString('hex')}`
}

const hashApiKey = (apiKey) => {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
};

module.exports = {generateApiKey, hashApiKey};