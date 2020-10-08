const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')

// 创建token类

class Jwt {
    constructor (data) {
        this.data = data
    }

    // 生成token
    generateToken() {
        let data = this.data
        // 注意：这里的now()!!!!!!!浪费我半个下午
        let created = Math.floor(Date.now() / 1000)
        let cert = fs.readFileSync(path.join(__dirname, './pem/rsa_private_key.pem'))
        let token = jwt.sign({
            data,
            exp: created + 60 * 30 * 60,
        }, cert, {algorithm: 'RS256'});
        return token;
    }

    // 校验token
    verifyToken(data) {
        if (data) {
            this.data = data;
        }
        let token = this.data
        let cert = fs.readFileSync(path.join(__dirname, './pem/rsa_public_key.pem'))
        let res;
        try {
            let result = jwt.verify(token, cert, {algorithms: ['RS256']}) || {};
            let {exp=0} = result, current = Math.floor(Date.now() / 1000);
            if(current <= exp) {
                res = result.data || {};
            }
        } catch (e) {
            res = 'err'
        }
        return res;
    }
}

module.exports = Jwt

