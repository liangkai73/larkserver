const KOA = require('koa');
// const parser = require('koa-bodyparser');
const InitManage = require('./core/init')
const { koaBody } = require('koa-body');
const bodyParser = require('koa-bodyparser');
const path = require('path')


const app = new KOA();

// app.use(koaBody({
//     json: true,
//     multipart: true, // 支持文件上传
//     encoding: 'gzip',
//     formidable: {
//         uploadDir: path.join(__dirname, 'public/upload/'), // 设置文件上传目录
//         keepExtensions: true,    // 保持文件的后缀
//         maxFieldsSize: 2 * 1024 * 1024, // 文件上传大小
//         onFileBegin: (name, file) => { // 文件上传前的设置
//             // console.log(`name: ${name}`);
//             // console.log(file);
//         },
//     }
// }));
app.use(bodyParser());
InitManage.init(app);

app.listen(3005)