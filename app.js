const express = require('express')
const router = require('./router')
const JwtUtil = require('./jwt')
const { static } = require('express')
const bodyParser = require('body-parser') 
var session = require('express-session')

// 在Express这个框架中，默认不支持Session和Cookie，但是可以使用第三方中间件：express-session来解决

var app = express()

// 配置express-session
/* 
  使用：
    当把这个插件配置好后，就可以通过req.session来发访问和设置Session成员
    添加Session数据：req.session.foo = 'bar'
    访问Session数据：req.session.foo
*/
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization,token, Accept, X-Requested-With , yourHeaderFeild');
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
  });

  // 进行token校验请求过滤
  // app.use(function (req, res, next) {

  // })


app.use(router)

app.listen(3000, () => console.log('Server is Running...'))