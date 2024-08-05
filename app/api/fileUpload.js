const Router = require('koa-router')
const router = new Router();


router.post('/imgUpload', async (ctx) => {
    console.log(ctx);
    console.log(ctx.request.body);
    ctx.body = JSON.stringify(ctx.request.files);
})

router.get('/testApi', async (ctx) => {

    console.log(11111);
    console.log(ctx);

})
module.exports = router
