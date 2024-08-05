
const requireDerictory = require('require-directory');

const Router = require('koa-router');


class InitManage {

    static init(app) {
        InitManage.app = app;
        InitManage.routesLoad();
        console.log('start success!')
    }
    static routesLoad() {
        const DirectoryPath = `${process.cwd()}/app/api`;

        requireDerictory(module, DirectoryPath, {
            visit: function (obj) {
                if (obj instanceof Router) {
                    InitManage.app.use(obj.routes())
                }
            }
        })

    }
}


module.exports = InitManage;