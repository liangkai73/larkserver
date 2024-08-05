

const Config = {
    requestUrl: 'http://iottest.chargeland.cn/evcs/v1/', // 测试
    // requestUrl: 'http://47.107.104.76:8086/evcs/v1/',   // 个人
    OperatorID: "fdKWk5DDw", // 运营商标识
    SigSecret: "37C9CE081873758811843E463AD65E78", // 签名秘钥
    OperatorSecret: "B4650E2054A938A4CDBA5316829386D8172D1727016262B2EE", // 运营商秘钥
    DataSecret: "EB78BAB84C5D9C58", // 加密秘钥
    DataSecretIV: "B01488A2812A5B44", // 加密向量
    DataSecretPadding: 'PKCS5Padding' // 加密填充

}

module.exports = Config