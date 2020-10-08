const path = require('path')
const fs = require('fs')
const qiniu = require('qiniu')

const accessKey = '7ho0rkbTHJ_FpPu98Qr_3OZa1vA5nZh6E7QOCetY'
const secretKey = '5HtpruxN3MMM3K-zFFK9aAui569Ymbr4lxopKNSQ'
const mac= new qiniu.auth.digest.Mac(accessKey, secretKey)

const options = {
    scope: 'fengyuan123'
}
const putPolicy = new qiniu.rs.PutPolicy(options)
const uploadToken = putPolicy.uploadToken(mac)

const config = new qiniu.conf.Config()
const formUploader =new qiniu.form_up.FormUploader(config)
const putExtra = new qiniu.form_up.PutExtra()

exports.putFile = (localFile) => {
    const basename = path.basename(localFile)
    const key = 'vuenode/' + basename
    return new Promise((resolve, reject) => {
        formUploader.putFile(uploadToken, key, localFile, putExtra, (respErr, respBody, respInfo) => {
            fs.unlinkSync(`${process.cwd()}/tmp/${basename}`)
            if(respErr) reject(respErr)
            else if(respInfo.status == 200) resolve(`http://cdn.wackyboy.top/${key}`)
            else reject()
        })
    })
}



