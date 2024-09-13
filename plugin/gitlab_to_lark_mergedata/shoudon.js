
const { default: axios } = require("axios")
const LarkProjectService = require('../../service/larkProject');
const { mergeFiles } = require('./mergeFiles');


async function shoudon() {
    let larkService
    // 获取飞书服务
    const getLarkService = async (lark_project_key) => {
        const projectToken = await LarkProjectService.refreshAccessToken();
        const projectService = await new LarkProjectService(projectToken, lark_project_key);
        return projectService;
    }
    // 测试空间
    // const larkKey = '667bc61ab77f92d209799c85'
    // // 正式空间
    const larkKey = '64998d0966831488c85ee14c'
    larkService = await getLarkService(larkKey);
    // 
    const id = 4891429294;
    const body = "##  wshop v1.48.25 版本更新日志  \n**李娜**  \n[#4891421583](https://project.feishu.cn/wshop/issues/detail/4891421583) 【缺陷】【弃单】弃单升级命令sync-checkout-channel同版本不匹配  !17557  \n**危俊泰**  \n[#4759856513](https://project.feishu.cn/wshop/issues/storys/4759856513) 客户线合并【A】【设置-员工管理】订单导出权限支持控制是否允许导出顾客信息  !17457  \n[#4761654091](https://project.feishu.cn/wshop/issues/storys/4761654091) 客户线合并【A】【设置模块-追踪设置】PayPal Shopping SDK接入  !17457     \n**吴曦**  \n[#WSHOP-29093](https://wfwl.pingcode.com/agile/items/66bc51775816cd1f806dc493) 【小优化】【技术改进】【数据上报助手】全量兼容使用独立服务接口 !17411  \n**张清洪**  \n[#WSHOP-28932](https://wfwl.pingcode.com/agile/items/66a6f59e910128cc6fecfb9c) 【小功能】【A】【应用中心-组合商品】新增组合商品图片比例配置   !17319"
    const data = {
        project: {
            web_url: 'https://git.papamk.com/xgrit/wshop'
        },
        description: body
    }
    mergeFiles(larkService, data, id)
}

shoudon()