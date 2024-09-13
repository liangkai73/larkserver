const { padStart } = require("lodash");
const { versionNumber, workItemEnum } = require('./config')



const errorItems = [];

async function larkFix(larkService, dataArr, gitlabeId) {


    const { data: larkServiceType } = await larkService.allTypes();
    const versionManagement = larkServiceType.find((item) => item.name === '版本管理');
    const { data: itemOptions } = await larkService.getAllFieldByWorkItem(versionManagement.type_key);
    const successItems = [];

    // 批量限制10
    let queryArr = [];
    for (let i = 0; i < dataArr.length; i += 10) {
        const chunk = dataArr.slice(i, i + 10);
        queryArr.push(chunk);
    }
    console.log('queryArr:', queryArr);

    const updateFun = async (larkService, arr, log) => {
        console.log('预计更新片段:', arr);
        const asyncArr = [];
        arr.forEach(item => {
            asyncArr.push(gitlabSyncVersionToLark(larkService, item, versionManagement, itemOptions, gitlabeId).then(res => {
                console.log(item.name + log + res + ':success')
                item.versionId = res;
                successItems.push(item)
            }).catch(err => {
                console.log(err)
                console.log(item.name + log + ':error')
                errorItems.push(item)
            }))
        });
        let temTimer = new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true)
                console.log('时间占位1500ms:success')
            }, 1500);
        })
        asyncArr.push(temTimer)
        return Promise.all(asyncArr)
    };

    do {
        let arr = queryArr.splice(0, 1)[0]
        await updateFun(larkService, arr, '新增版本')
    }
    while (queryArr.length > 0)
    console.dir('errorItems:', errorItems);
    console.dir('successItems:', successItems);
    return Promise.resolve(successItems);
}


// 将版本信息转为权重信息
const versionToWeight = (version) => {
    // 写入版本权重信息
    const versionWeightsList = version.split('-');
    const normalVersionList = versionWeightsList[0].replace(/[a-zA-Z]/g, '').split('.');
    const zeroList = normalVersionList.map((item) => padStart(item, 3, '0'));
    let normalVersion = zeroList.join('');
    if (version.includes('-')) {
        const specialVersionList = versionWeightsList[1].split('.');
        if (specialVersionList[0] === 'h') {
            normalVersion = normalVersion + '2' + padStart(specialVersionList[1], 3, '0');
        } else if (specialVersionList[0] === 'beta') {
            normalVersion = normalVersion + '0' + padStart(specialVersionList[1], 3, '0');
        }
    } else {
        normalVersion += '1000';
    }
    return {
        field_alias: "version_weights",
        field_value: normalVersion * 1
    };
}


// 创建版本管理
const gitlabSyncVersionToLark = async (larkService, bodyData, versionManagement, itemOptions, gitlabeId) => {
    try {

        // 自定义参数
        const field_value_pairs = [
            {
                field_alias: "version_number",
                field_name: "版本号",
                field_value: bodyData.name
            },
            {
                field_alias: "is_hotfix",
                field_name: "是否hotfix",
                field_value: bodyData.name.includes('h')
            },
            {
                field_alias: "gitlab_version_url",
                field_name: "版本发布链接",
                field_value: [{
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "hyperlink",
                            "attrs": {
                                "title": bodyData._links.self,
                                "url": bodyData._links.self
                            }
                        }
                    ]
                }]
            },
            {
                field_key: "business",
                field_name: "业务线",
                field_value: '64998d0b7c32a9ba048ec760' // 正式
                // field_value: '667bc61c81e856ac7c18e29a' // 正常迭代
            },
            {
                field_alias: "gitlab_sync",
                field_name: "是否gitlab迁移",
                field_value: true
            }
        ];
        // 判断是否是无效版本, 如果是无效版本就修改测试结论到无效版本
        // if (bodyData.description && bodyData.description.includes('{无效版本}')) {
        //     const testResultOptions = itemOptions.find((item) => item.field_alias === 'test_result').options || [];
        //     const testResultValue = testResultOptions.find((item) => item.label === '无效版本') ? testResultOptions.find((item) => item.label === '无效版本').value : null;
        //     field_value_pairs.push({
        //         field_alias: "test_result",
        //         field_name: "测试结论",
        //         field_value: {
        //             value: testResultValue
        //         }
        //     });
        // }
        let workItemName = '';
        const defaultApplicationOptions = {
            // saas
            // 1971: 'Wshop Store',
            71: 'Wshop Store',
            577: 'Newshop admin',
            503: 'Mshop admin',
            80: 'Wp'
        }
        // 选择模板
        const templateOptions = itemOptions.find((item) => item.field_alias === 'template').options || [];
        // 选择应用端
        const applicationOptions = itemOptions.find((item) => item.field_alias === 'application').options || [];
        if (applicationOptions && defaultApplicationOptions[gitlabeId]) {
            const application = applicationOptions.find((item) => item.label.toLowerCase() === defaultApplicationOptions[gitlabeId].toLowerCase());
            if (application && application.value) {
                workItemName = `${application.label} - ${bodyData.name}`;
                field_value_pairs.push({
                    field_alias: "application",
                    field_name: "应用端",
                    field_value: [{ value: application.value }]
                });
            }
        }
        field_value_pairs.push(versionToWeight(bodyData.name));

        // 查询版本号是否已经存在
        const params = {
            "search_group": {
                "conjunction": "AND",
                "search_params": [
                    // 查询版本号
                    {
                        "param_key": "name",
                        "value": workItemName,
                        "operator": "="
                    }
                ]
            }
        }
        let { data = [] } = await larkService.searchByParams(workItemEnum['版本管理'], params)
        if (data.length > 0) {
            console.log('版本号已存在:', bodyData.name)
            return Promise.resolve(data[0].id)

        }
        console.log('版本号不存在:', bodyData.name)


        const { data: createId } = await larkService.createWorkItem({
            work_item_type_key: versionManagement.type_key,
            name: workItemName,
            template_id: templateOptions[0].value,
            field_value_pairs
        }, '7132723895836147715')
        // console.log('gitlabSyncVersionToLark: 创建成功');
        return Promise.resolve(createId);
    } catch (e) {
        console.log(e)
        throw Error(e);
    }
}


module.exports = { larkFix };