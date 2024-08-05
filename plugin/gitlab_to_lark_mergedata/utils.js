const { padStart } = require("lodash");

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
    const regex = /\)(.*?)【(.*?)】/g;
    let match = regex.exec(str);
    let Type;
    if (match !== null) {
        Type = match[2] == '缺陷' ? '缺陷' : '需求'; // 第二个捕获组的内容，即【】中的内容
    }
    return Type
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
    versionToWeight
}

// getDescItem(str)