const fs = require('fs')
const multer = require('multer')

const storage = multer.diskStorage({
    // process.cwd() 返回当前node.js的工作目录
    destination(req, file, cb) {
        const path = `${process.cwd()}/tmp/`;
        if(!fs.existsSync(path)) {
            fs.mkdirSync(path)
        }
        cb(null, path)
    },

    // 给上传的文件重命名,获取添加后缀名
    filename(req, file, cb) {
        let fileFormat = (file.originalname).split(".");
        cb(null, file.fieldname + '-' + Date.now() + "." + fileFormat[fileFormat.length - 1]);
    }
})


// 添加配置文件multer对象
let upload = multer({
    storage: storage
});


module.exports = upload

