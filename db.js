const mysql = require('mysql')

const db =  mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'platform'
})

db.connect()

module.exports = (sql, callback) => {
    return new Promise((resolve, reject) => {
        db.query(sql, (err, data) => {
            if(err) reject(err)
            else resolve(data)
        })
    })
}
