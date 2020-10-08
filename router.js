const db = require('./db')
const fs = require('fs')
const express = require('express')
const JwtUtil = require('./jwt')
const multer = require('./multer')
const router = express.Router()
const formidable = require('formidable')
const path = require('path')
const { putFile } = require('./qiniu-oss')



router.get('/', async (req, res) => {
    const meta = {
        code: 0,
        msg: '',
        status: ''
    }
    const { id } = req.query
    const data = await db('select * from talk')
    const data2 = await db('select * from `like`')
    const data3 = await db('select * from comment')
    await db('update talk as tt set tt.like_count = (select count(*) from `like` as li where tt.t_id = li.t_id )')
    await db('update talk as tt set tt.comment_count = (select count(*) from comment as co where tt.t_id = co.t_id )')
    try {
        if (data) {
            // req.session.isLogin = false
            // console.log( req.session.isLogin);
            meta.msg = '数据已被查询到'
            meta.code = 1
            meta.status = 200
            res.statusCode = 200
            res.json({ data, meta, data2, data3 })
        } else {
            meta.msg = '数据为空'
            meta.status = 400
            res.statusCode = 400
            res.json({ data, meta })
        }
    } catch (e) {
        meta.msg = '服务器出错'
        meta.code = -1
        meta.status = 400
        req.statusCode = 400
        res.json({ data, meta })
    }
})


router.post('/login', async (req, res) => {
    // 测试
    // const loginMsg = url.parse(req.url, true).query
    // const loginMsg = req.body
    // console.log(loginMsg);
    const userName = req.body.userName
    const password = req.body.password
    const meta = {
        code: 0,
        msg: '',
        status: ''
    }
    try {
        // 带不带括号
        const [result] = await db('select * from user where userName = "' + userName + '" and password = "' + password + '"')
        if (result) {
            // 登录成功，使用Session记录用户的登录状态
            // req.session.isLogin = true
            // 登录成功，添加token验证，是_id还是userId？？？？？

            let _id = result.userId.toString()
            let jwt = new JwtUtil(_id)
            let token = jwt.generateToken()
            meta.code = 1
            meta.status = 200
            meta.msg = '登录成功'
            res.statusCode = 200
            res.json({ result, meta, token: token })
        } else {
            meta.msg = '用户不存在或者密码错误'
            meta.status = 400
            res.statusCode = 400
            res.json({ result, meta })
        }
    } catch (err) {
        meta.msg = '登录失败，请重新操作'
        meta.code = -1
        meta.status = 400
        res.statusCode = 400
        res.json({ meta })
    }
})

/**
 * 注册
 */
router.post('/register', async (req, res) => {
    const userName = req.body.userName
    const password = req.body.password

    const meta = {
        code: 0,
        msg: '',
        status: ''
    }

    try {
        // 带不带括号
        const result = await db('select * from user where userName = "' + userName + '"')
        if (result.length < 1) {
            // 注册成功，使用Session记录用户的登录状态
            // req.session.isLogin = true
            // 注册成功，添加token验证，同时将用户的信息保存到数据库中
            await db('insert into user set userName="' + userName + '", password="' + password + '"')
            meta.code = 1
            meta.status = 200
            meta.msg = '注册成功'
            res.statusCode = 200
            res.json({ result, meta })
        } else {
            meta.msg = '用户已经存在'
            meta.status = 400
            res.statusCode = 400
            res.json({ result, meta })
        }
    } catch (err) {
        meta.msg = '注册失败，请重新操作'
        meta.code = -1
        meta.status = 400
        res.statusCode = 400
        res.json({ meta })
    }

})


router.get('/info', async (req, res) => {
    let token = req.headers.token
    let jwt = new JwtUtil(token)
    let result = jwt.verifyToken(token)
    const meta = {
        code: 0,
        msg: '',
        status: ''
    }
    try {
        // 带不带括号
        [result] = await db('select * from user where userId = ' + result)
        if (result) {
            // 根据userId查询用户的信息，查询成功相应给客户端
            meta.code = 1
            meta.status = 200
            meta.msg = '获取数据成功'
            res.statusCode = 200
            res.json({ result, meta })
        } else {
            meta.msg = '获取数据失败'
            meta.status = 400
            res.statusCode = 400
            res.json({ result, meta })
        }
    } catch (err) {
        meta.msg = '请求报错，请重试'
        meta.code = -1
        meta.status = 400
        res.statusCode = 400
        res.json({ meta })
    }

})

router.post('/changeUserHeadpic', multer.array('file'), async (req, res) => {
    const meta = {
        code: 0,
        msg: '',
        status: ''
    }
    console.log('token: ', req.headers.token);
    let token = req.headers.token
    let jwt = new JwtUtil(token)
    try {
        const userId = jwt.verifyToken(token)
        console.log('userId: ', userId);
        const cwd = process.cwd()
        const file = req.files[0]
        const filePath = `${cwd}/tmp/${file.filename}`
        const fileUrl1 = await putFile(filePath)
        const fileUrl = [fileUrl1, '~1600'].join('')
        const data = await db('update user set avatar_img="' + fileUrl + '" where userId="' + userId + '"')
        const data2 = await db('update talk set img="' + fileUrl + '" where u_id="' + userId + '"')
        console.log('data: ', data);
        if(data) {
            meta.code = 1
            meta.status = 200
            meta.msg = '修改成功'
            res.json({data: fileUrl, meta})   
        } else {
            meta.code = -1
            meta.status = 400
            meta.msg = '更新数据出错'
            res.json({data: null, meta})
        }
    } catch (e) {
        meta.code = -1
        meta.status = 400
        meta.msg = '更新数据出错'
        res.json({data: null, meta})
    }
})



router.post('/uploadMind', async(req, res) => {
    let token = req.headers.token
    let jwt = new JwtUtil(token)
    let result = jwt.verifyToken(token)
    console.log(result);
    const textarea = req.body.textarea
    const time = req.body.time
    const meta = {
        code: 0,
        msg: '',
        status: ''
    }
    try {
        [result] = await db('select * from user where userId = ' + result)
        console.log('result: ', result);
        console.log('time: ', time);
        const data = await db('insert into talk set img ="' + result.avatar_img + '", content = "' + textarea + '", u_id = "' + result.userId + '", upload_time = "' + time + '"' )
        if(data) {
            console.log("发布成功！");
            meta.code = 1
            meta.status = 200
            meta.msg = '发布成功！'
            res.statusCode = 200
            res.json({meta})
        } else {
            console.log("产生错误");        
            meta.msg = '产生错误'
            meta.code = -1
            meta.status = 400
            res.statusCode = 400
            res.json({meta})
        }
    } catch(err) {
        console.log('发布出错！');
        meta.msg = '发布出错！'
        meta.code = -1
        meta.status = 400
        res.statusCode = 400
        res.json({meta})
    }

})

router.post('/like', async (req, res) => {
    let token = req.headers.token
    let jwt = new JwtUtil(token)
    let result = jwt.verifyToken(token)
    let t_id = req.body.t_id
    const meta = {
        code: 0,
        msg: '',
        status: ''
    }
    try{

        const [data] = await db('select * from `like` where u_id = ' + result + ' and t_id = ' + t_id);
        if(data) {
            await db('delete from `like` where l_id = ' + data.l_id)
            await db('update talk as tt set tt.like_count = (select count(*) from `like` as li where tt.t_id = li.t_id )')
            meta.msg = '删除喜爱成功！'
            meta.code = 1
            meta.status = 200
            res.statusCode = 200
            res.json({meta})
        } else {
            await db('insert into `like` set t_id = ' + t_id + ' , u_id = ' + result + ' , state = 1');
            await db('update talk as tt set tt.like_count = (select count(*) from `like` as li where tt.t_id = li.t_id )')
            meta.msg = '添加喜爱成功！'
            meta.code = 1
            meta.status = 200
            res.statusCode = 200
            res.json({meta})
        }

    } catch(err) {
        meta.msg = '发布出错！'
        meta.code = -1
        meta.status = 400
        req.statusCode = 400
        res.json({ meta })
    }


})

router.post('/show_comment_list', async(req, res) => {
    let token = req.headers.token
    let t_id = req.body.t_id
    let jwt = new JwtUtil(token)
    let result = jwt.verifyToken(token)
    let comment_list = []
    const meta = {
        code: 0,
        msg: '',
        status: ''
    }
    try {
        comment_list = await db('select * from comment where t_id = ' + t_id)
        console.log(comment_list);
        meta.code = 1
        meta.status = 200
        meta.msg = '获取评论列表成功'
        res.statusCode = 200
        res.json({meta, data: comment_list})
    } catch (err) {
        console.log("出粗了");
        meta.code = 0
        meta.status = 400
        meta.msg = '获取空的评论列表'
        res.statusCode = 400
        res.json({meta})
    }
})



router.post('/uploadComment', async(req, res) => {
    let token = req.headers.token
    let jwt = new JwtUtil(token)
    let result = jwt.verifyToken(token)
    console.log('谁发表的评论：', result);
    const comment_content = req.body.comment_content
    const t_id = req.body.t_id
    const avatar_img = req.body.avatar_img
    const comment_time = req.body.comment_time
    const meta = {
        code: 0,
        msg: '',
        status: ''
    }
    try {

        const data = await db('insert into comment set t_id = ' + t_id + ', u_id = ' + result + ', content = "' + comment_content + '", avatar_img = "' + avatar_img + '", comment_time = "' + comment_time + '"');
        if(data) {
            console.log("评论成功");
            // 更新talk表数据, 是否需要，前面的'/'初始路径下已经请求访问过了，两者选择一
            await db('update talk as tt set tt.comment_count = (select count(*) from comment as co where tt.t_id = co.t_id )')
            console.log("评论成功！");
            meta.code = 1
            meta.status = 200
            meta.msg = '评论成功！'
            res.statusCode = 200
            res.json({meta})
        } else {
            console.log("产生错误");        
            meta.msg = '产生错误'
            meta.code = -1
            meta.status = 400
            res.statusCode = 400
            res.json({meta})
        }

    } catch (err) {
        console.log('评论出错！');
        meta.msg = '评论出错！'
        meta.code = -1
        meta.status = 400
        res.statusCode = 400
        res.json({meta})
    }
    
    
})

router.post('/update/avatar', async (req, res) => {
    let token = req.headers.token
    let jwt = new JwtUtil(token)
    let result = jwt.verifyToken(token)
    let form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, './public/images')
    form.keepExtensions = true
    await new Promise((resolve, reject) => {
        form.parse(req, function (err, fields, file) {
            var filePath = '';
            if (file.tmpFile) {
                filePath = file.tmpFile.path;
            } else {
                for (var key in file) {
                    if (file[key].path && filePath === '') {
                        filePath = file[key].path;
                        break;
                    }
                }
            }
            console.log('filePath: ', filePath);
            var fileExt = filePath.substring(filePath.lastIndexOf('.'))
            if (('.jpg.jpeg.png.gif').indexOf(fileExt.toLowerCase()) === -1) {
                var err = new Error('此文件类型不允许上传！')
                meta.code = -1
                meta.status = 403
                meta.msg = '此文件类型不允许上传！'
                res.json({ meta })
            }
            var targetDir = path.join(__dirname, './public/upload');
            // 以当前的时间戳对上传文档重命名
            var fileName = new Date().getTime() + fileExt
            var targetFile = path.join(targetDir, fileName)
            fs.rename(filePath, targetFile, function (err) {
                if (err) {
                    console.log(err);
                    meta.status = 403
                    meta.status = -1
                    meta.msg = '操作失败！'
                    res.json({ meta })
                }
            })
        })

    })



})






module.exports = router




