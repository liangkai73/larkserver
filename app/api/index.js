
const Router = require('koa-router')
const router = new Router();
const axios = require('axios');
const config = require('../../config')
const { encryption, decryption, md5cryption } = require('../../utils/crypto')
const { getDateStr, getSEQ } = require('../../utils/tools')
const { updateConclusion } = require("../../plugin/gitlab_to_lark_mergedata/updateConclusion");
const { temMigrate } = require("../../plugin/gitlab_to_lark_mergedata/temMigrate.js");


// 获取小蓝token认证

router.get('/api/login', async (ctx, next) => {

    var obj = {
        OperatorID: config.OperatorID,
        OperatorSecret: config.OperatorSecret,
    }

    await axios({
        method: 'post',
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        url: config.requestUrl + 'query_token',
        data: obj
    }).then((result) => {
        console.log(result.data)
        ctx.response.body = result.data
    }).catch((err) => {
        console.log(err)
    });

    next()

})
// 查询充电站信息

router.get('/api/stations', async (ctx, next) => {


    const date1 = getDateStr(new Date(), 2)
    const date2 = getDateStr(new Date(), 9)
    const seq = getSEQ()

    var obj = {
        LastQueryTime: '',
        PageNo: 1,
        PageSize: 20,
    }
    // data加密
    const sea128str = encryption(JSON.stringify(obj));

    // md5签名
    const md5Res = md5cryption(config.OperatorID + sea128str + date2 + seq)

    const params = {
        OperatorID: config.OperatorID,
        Data: sea128str,
        TimeStamp: date2,
        Sig: md5Res,
        Seq: seq
    }

    await axios({
        method: 'post',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'Authorization': 'eyJhbGciOiJIUzUxMiJ9.eyJrZXkiOiJFQjc4QkFCODRDNUQ5QzU4In0.vuaEUHpBmnupxW1PZs9dgFYk0kQ5USJAtEJmelQnkcfjZf0LMDB4fcYraWHUNk_5b6DCyjm2fJz-AeOIw2hoqQ'
        },
        url: config.requestUrl + 'query_stations_info',
        data: params
    }).then((result) => {
        console.dir(result)
        console.dir(decryption(result.data.Data))
        console.dir(decryption("C0MQVHWUsyvMrObxFz3xLi2m3qZ3qAGk9I1ueblRBDcxaFcNt+cUCDPe4AYZKX8v5mmCCuVnw+XdF1BygwVzql+Sp9uahth1ZAtCMK+e3gavtMRndA1AukChuXEz44JRyIjHYoVSulDaveUOTQxQOzwZU03zd2pFi7f8YOuW6A0="))
        ctx.response.body = decryption(result.data.Data)
    }).catch((err) => {
        console.log(err)
    });

    next()

})
// 请求设备认证

router.get('/api/equipAuth', async (ctx, next) => {

    const date2 = getDateStr(new Date(), 9)
    const seq = getSEQ()

    var obj = {
        EquiPAuthSeq: config.OperatorID,
        ConnectorID: '1',
    }


    // data加密
    const sea128str = encryption(JSON.stringify(obj));

    // md5签名
    const md5Res = md5cryption(config.OperatorID + sea128str + date2 + seq)

    const params = {
        OperatorID: config.OperatorID,
        Data: sea128str,
        TimeStamp: date2,
        Sig: md5Res,
        Seq: seq
    }

    await axios({
        method: 'post',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'Authorization': 'eyJhbGciOiJIUzUxMiJ9.eyJrZXkiOiJFQjc4QkFCODRDNUQ5QzU4In0.vuaEUHpBmnupxW1PZs9dgFYk0kQ5USJAtEJmelQnkcfjZf0LMDB4fcYraWHUNk_5b6DCyjm2fJz-AeOIw2hoqQ'
        },
        url: config.requestUrl + 'query_equip_auth',
        data: params
    }).then((result) => {
        // console.dir(result)
        console.dir(decryption(result.data.Data))
        ctx.response.body = decryption(result.data.Data)
    }).catch((err) => {
        console.log(err)
    });

    next()

})
// 请求启动充电

router.get('/api/startCharge', async (ctx, next) => {

    var obj = {
        StartChargeSeq: config.OperatorID,
        ConnectorID: '1',
        QRCode: ''
    }


    const date2 = getDateStr(new Date(), 9)
    const seq = getSEQ()


    // data加密
    const sea128str = encryption(JSON.stringify(obj));

    // md5签名
    const md5Res = md5cryption(config.OperatorID + sea128str + date2 + seq)

    const params = {
        OperatorID: config.OperatorID,
        Data: sea128str,
        TimeStamp: date2,
        Sig: md5Res,
        Seq: seq
    }

    await axios({
        method: 'post',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'Authorization': 'eyJhbGciOiJIUzUxMiJ9.eyJrZXkiOiJFQjc4QkFCODRDNUQ5QzU4In0.vuaEUHpBmnupxW1PZs9dgFYk0kQ5USJAtEJmelQnkcfjZf0LMDB4fcYraWHUNk_5b6DCyjm2fJz-AeOIw2hoqQ'
        },
        url: config.requestUrl + 'query_start_charge',
        data: params
    }).then((result) => {
        // console.dir(result)
        console.dir(decryption(result.data.Data))
        ctx.response.body = decryption(result.data.Data)
    }).catch((err) => {
        console.log(err)
    });

    next()

})
// 请求停止充电

router.get('/api/stopCharge', async (ctx, next) => {

    var obj = {
        StartChargeSeq: config.OperatorID,
        ConnectorID: '1',
    }


    const date2 = getDateStr(new Date(), 9)
    const seq = getSEQ()


    // data加密
    const sea128str = encryption(JSON.stringify(obj));

    // md5签名
    const md5Res = md5cryption(config.OperatorID + sea128str + date2 + seq)

    const params = {
        OperatorID: config.OperatorID,
        Data: sea128str,
        TimeStamp: date2,
        Sig: md5Res,
        Seq: seq
    }

    await axios({
        method: 'post',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'Authorization': 'eyJhbGciOiJIUzUxMiJ9.eyJrZXkiOiJFQjc4QkFCODRDNUQ5QzU4In0.vuaEUHpBmnupxW1PZs9dgFYk0kQ5USJAtEJmelQnkcfjZf0LMDB4fcYraWHUNk_5b6DCyjm2fJz-AeOIw2hoqQ'
        },
        url: config.requestUrl + 'query_stop_charge',
        data: params
    }).then((result) => {
        // console.dir(result)
        console.dir(decryption(result.data.Data))
        ctx.response.body = decryption(result.data.Data)
    }).catch((err) => {
        console.log(err)
    });

    next()

})

// 接收启动充电结果
router.post('/api/notification_start_charge_result', async (ctx, next) => {

    const body = ctx.request.body
    // const { Data } = body
    // const reldata = decryption(Date)

    // console.log(reldata);

    obj = {
        res: 111
    }

    ctx.response.body = JSON.stringify(obj)

    next()

})

// 充电订单信息获取
router.post('/api/notification_charge_order_info', async (ctx, next) => {

    const body = ctx.request.body
    // const { Data } = body
    // const reldata = decryption(Date)

    // console.log(reldata);

    obj = {
        res: 111
    }

    ctx.response.body = JSON.stringify(obj)

    next()

})
router.post('/', async (ctx, next) => {
    console.log(ctx.request.header)

    const body = ctx.request.body
    // const { Data } = body
    // const reldata = decryption(Date)

    console.log(body.header);
    // console.log(body.payload);
    const header = body.header;
    if (header && header.event_type && header.event_type == 'WorkitemUpdateEvent') {
        updateConclusion(body);
    }

    // handler(ctx.request,ctx.response)

    obj = {
        res: 111
    }
    ctx.response.body = JSON.stringify(obj)

    next()

})
// 迁移
router.get('/runMigrate', async (ctx, next) => {
    console.log(ctx.request.header)

    const { id } = ctx.query
    // const { Data } = body
    // const reldata = decryption(Date)

    console.log(id);
    temMigrate(id);
    // console.log(body.payload);
    obj = {
        res: 'success'
    }
    ctx.response.body = JSON.stringify(obj)

    next()

})





module.exports = router