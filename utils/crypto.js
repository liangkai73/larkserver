'use strict';

const crypto = require('crypto');
const app_config = require("../config");

/**

* AES加密的配置

* 1.密钥

* 2.偏移向量

* 3.算法模式CBC

* 4.补全值

*/

var AES_conf = {
    key: app_config.DataSecret, //密钥

    iv: app_config.DataSecretIV, //偏移向量

    padding: app_config.DataSecretPadding //加密填充

}

/**

* AES_128_CBC 加密

* 128位

* return base64

*/

function encryption(data) {
    let key = AES_conf.key;
    // let key = '1234567890abcdef';

    let iv = AES_conf.iv;
    // let iv = '1234567890abcdef';

    let padding = AES_conf.padding;

    var cipherChunks = [];

    var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);

    cipher.setAutoPadding(true);

    cipherChunks.push(cipher.update(data, 'utf8', 'base64'));

    cipherChunks.push(cipher.final('base64'));

    return cipherChunks.join('');

}
// 解密
function decryption(data) {
    let key = AES_conf.key;

    let iv = AES_conf.iv;

    // let padding = AES_conf.padding;

    var cipherChunks = [];

    var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);

    decipher.setAutoPadding(true);

    cipherChunks.push(decipher.update(data, 'base64', 'utf8'));

    cipherChunks.push(decipher.final('utf8'));

    return cipherChunks.join('');

}
//  md5加密算法
function md5cryption(data) {

    console.log(data)
    const hmac = crypto.createHmac('md5', '37C9CE081873758811843E463AD65E78');
    // 往hmac对象中添加摘要内容

    const up = hmac.update(data);

    // 使用 digest 方法输出摘要内容
    let result = up.digest('hex');
    result = result.toUpperCase()
    console.log(result)
    return result
}
module.exports = {
    encryption,
    decryption,
    md5cryption
}