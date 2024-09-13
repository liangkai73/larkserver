const { padStart } = require("lodash");

// const str = '##  wshop v1.48.0-beta.10 版本更新日志  \n**吴国锋**  \n回滚 [#WSHOP-29035](https: //wfwl.pingcode.com/agile/items/66b97dc8df1b6972d74db5d3) 【缺陷】【顾客】单页结账邮箱由合规变成不合规时生成的顾客异常，导致相关邮件发送会报错 !17408  \n[#WSHOP-28986](https://wfwl.pingcode.com/agile/items/66b46975b8ec715dd09aeffe) 【小优化】【技术改进】【支付模块】nspayment，pacypay，payoneer，payssion，stripe服务相关网关替换ordermeta读写方法 !17323  \n**林潇**  \n[#WSHOP-29109](https://wfwl.pingcode.com/agile/items/66bc7edf5bbf9a1e87a05be8) 【缺陷】【物流】应用优惠码物流运费有变化时、结账页的订单摘要中显示的运费没有更新 !17402  \n[#WSHOP-29127…dab0838beab6d1997c6f6) 【缺陷】【物流】新版营销，单页结账移动端顶部的金额显示错误、没有包含运费 !17402  \n**余清红**  \n[#WSHOP-29062](https://wfwl.pingcode.com/agile/items/66baf61d5816cd1f80684ea8) 【缺陷】【店铺装修-结账页】开启地区访问限制后，v2主题编辑器中结账页点击页脚政策链接提示403   !17383  \n**李娜**  \n[#WSHOP-29074](https://wfwl.pingcode.com/agile/items/66bb22323f1ffae8f57dc6f2) 【小优化】【技术需求】【购物车-结账页】单页结账变更国家方法优化   !17223\n\n##  依赖wp的版本是v1.10.37\n**李娜**  \n[#WSHOP-29074](https://wfwl.pingcode.com/agile/items/66bb22323f1ffae8f57dc6f2) 【小优化】【技术需求】【购物车-结账页】单页结账变更国家方法优化 !272 '
// const str = "##  wshop v1.48.25 版本更新日志  \n**李娜**  \n[#4891421583](https://project.feishu.cn/wshop/issues/detail/4891421583) 【缺陷】【弃单】弃单升级命令sync-checkout-channel同版本不匹配  !17557  \n**危俊泰**  \n[#4759856513](https://project.feishu.cn/wshop/storys/detail/4759856513) 客户线合并【A】【设置-员工管理】订单导出权限支持控制是否允许导出顾客信息  !17457  \n[#4761654091](https://project.feishu.cn/wshop/storys/detail/4761654091) 客户线合并【A】【设置模块-追踪设置】PayPal Shopping SDK接入  !17457     \n**吴曦**  \n[#WSHOP-29093](https://wfwl.pingcode.com/agile/items/66bc51775816cd1f806dc493) 【小优化】【技术改进】【数据上报助手】全量兼容使用独立服务接口 !17411  \n**张清洪**  \n[#WSHOP-28932](https://wfwl.pingcode.com/agile/items/66a6f59e910128cc6fecfb9c) 【小功能】【A】【应用中心-组合商品】新增组合商品图片比例配置   !17319"

// 获取desc中的item
function getDescItem(str) {
    const regex = /\(http[^!]*!(\d+)/g;  // 分段
    let getDescItem = [];
    let strNodes;

    while ((strNodes = regex.exec(str)) !== null) {
        const numberAfterExclamation = strNodes[1]; // 第一个捕获组的内容，即数字部分

        getDescItem.push({
            ItemId: getItemId(strNodes[0]),
            mergeId: numberAfterExclamation,
            type: getItemType(strNodes[0])

        })
        // console.log(getItemId(strNodes[0]))
    }
    return getDescItem
}
// 获取desc中的item - pinngcode版本
function getDescItemPingCode(str) {
    const regex = /\[#[^!]*!(\d+)/g;  // 分段
    let getDescItem = [];
    let strNodes;

    while ((strNodes = regex.exec(str)) !== null) {
        const numberAfterExclamation = strNodes[1]; // 第一个捕获组的内容，即数字部分

        getDescItem.push({
            isLarkItem: isLarkItem(strNodes[0]),
            mergeId: numberAfterExclamation,
            pingcodeId: getPingcodeId(strNodes[0]),
            type: getItemType(strNodes[0])

        })
    }
    return getDescItem
}
// 获取pingcideId
function getPingcodeId(str) {
    // console.log(str)
    const regex = /\[#(.*?)\]/g;
    const matches = [...str.matchAll(regex)].map(match => match[1]);
    // console.log(matches);
    return matches[0] || undefined
}
// 判断是否是lark item
function isLarkItem(str) {
    return str.includes('(https://project.feishu.cn/')
}
// 获取 itemId 
function getItemId(str) {
    const regex = /\(http[^)]*\)/g;
    const arr = str.match(regex);
    const i = arr[0];
    let id
    // console.log(i);
    if (i.includes('https')) {
        var node = i.split('/');
        node = node[node.length - 1];
        id = node.split(')')[0];
    }
    // console.log(id)
    return id || undefined
}
// 获取 item-Type : 缺陷|需求 
function getItemType(str) {
    // const regex = /\)(.*?)【(.*?)】/g;
    // let match = regex.exec(str);
    // let Type;
    // if (match !== null) {
    //     []
    //     Type = match[2] == '缺陷' ? '缺陷' : '需求'; // 第二个捕获组的内容，即【】中的内容
    // }
    if (str.includes('缺陷】')) {
        return '缺陷'
    } else {
        return '需求'
    }
}

// 将版本信息转为权重信息
const versionToWeight = (version) => {
    // 写入版本权重信息
    const versionWeightsList = version.split('-');
    const normalVersionList = versionWeightsList[0].replace(/[a-zA-Z]/g, '').split('.');
    const zeroList = normalVersionList.map((item) => padStart(item, 4, '0'));
    let normalVersion = zeroList.join('');

    if (version.includes('-')) {
        const specialVersionList = versionWeightsList[1].split('.');
        if (specialVersionList[0] === 'h') {
            normalVersion = normalVersion + '2' + padStart(specialVersionList[1], 4, '0');
        } else if (specialVersionList[0] === 'beta') {
            normalVersion = normalVersion + '0' + padStart(specialVersionList[1], 4, '0');
        }
    } else {
        normalVersion += '10000';
    }
    return {
        field_alias: "version_weights",
        field_value: normalVersion * 1
    };
}

module.exports = {
    getDescItem,
    versionToWeight,
    getDescItemPingCode
}

// console.log(getDescItemPingCode(str)) 