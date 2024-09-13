const { projectMap, workItemEnum, pingcodeIdEnum } = require("./config");
const { getDescItem, getDescItemPingCode } = require("./utils");
const { writeFileSync } = require('./fsData')

// 合并版本号&合并请求链接
/**
 * 
 * @param {*} larkService 飞书服务实例
 * @param {*} data gitlab-webhooks返回的data 
 * @param {*} id 版本管理-工作项id
 */
async function mergeFiles(larkService, data, id) {
    //  gitlab数据处理 -（）=> 需求-缺陷-版本号-飞书项目id
    const description = data.description;
    const projectUrl = data._links.edit_url.split('/releases')[0];
    const itemList = getDescItemPingCode(description);
    const fsJsonData = {
        name: data.name,
        itemList
    }
    writeFileSync(fsJsonData);

    //  计算链接排序index
    function getMergeLink(str, newUrl) {
        const regex = new RegExp('\n', 'g');
        const index = (str.match(regex) || []).length;
        if (str.includes(newUrl)) {
            return str
        }
        return str + `${index + 1}. ${newUrl}`
    }
    // 更新工作项-function
    async function updateDate(i = {}, itemId) {
        const gitlabUrlStr = projectUrl + `/merge_requests/${i.mergeId}\n`;
        const type = i.type;
        let typeKey = '';

        switch (type) {
            case '缺陷':
                typeKey = workItemEnum['缺陷管理']
                break
            case '需求':
                typeKey = workItemEnum['需求管理']
                break
        }
        // 获取详情
        return larkService.getWorkItemQuery(typeKey, { "work_item_ids": [itemId] }).then(res => {
            const { fields } = res.data[0];

            const mergeVersion = fields.filter(i => {
                if (type == '需求') {
                    return i.field_alias == 'merge_version'
                } else {
                    return i.field_alias == 'repairedition'
                }

            })
            const mergeLink = fields.filter(i => {
                return i.field_alias == 'merge_link'
            })
            const versionArr = mergeVersion[0] ? mergeVersion[0].field_value : [];
            const linkValue = mergeLink[0] ? mergeLink[0].field_value : '';
            versionArr.push(id);
            const updateParams = {
                "update_fields": [
                    {
                        "field_alias": type == '需求' ? "merge_version" : 'repairedition',
                        "field_value": versionArr
                    }
                ]
            }
            const updateParams2 = {
                "update_fields": [
                    {
                        "field_alias": "merge_link",
                        "field_value": getMergeLink(linkValue, gitlabUrlStr)
                    }
                ]
            }
            // console.log('updateParams', updateParams, 'itemId:', itemId, 'typekey', typeKey);
            let queryArr = [];

            queryArr.push(larkService.updateWorkItem(typeKey, itemId, updateParams).then(res => {
                console.log(type + '合并版本更新成功！------------------------' + itemId)
                return Promise.resolve(type + '合并版本更新成功！------------------------' + itemId)
            }).catch(err => {
                console.log(type + '合并版本更新失败！------------------------' + itemId)
                return Promise.resolve(type + '合并版本更新失败！------------------------' + itemId)
            }))
            queryArr.push(larkService.updateWorkItem(typeKey, itemId, updateParams2).then(res => {
                console.log(type + '合并请求链接更新成功！------------------------' + itemId)
                return Promise.resolve(type + '合并请求链接更新成功！------------------------' + itemId)
            }).catch(err => {
                console.log(type + '合并请求链接更新失败！------------------------' + itemId)
                return Promise.resolve(type + '合并请求链接更新失败！------------------------' + itemId)
            }))

            return Promise.all(queryArr)
        }).catch(err => {
            Promise.reject(err)
        })

    }

    if (itemList.length <= 0) {
        return Promise.reject({ name: data.name, msg: '处理失败：没有过滤出对应的pingcodeId' })
    }


    // 批量限制5
    function delay(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }
    if (itemList.length > 5) {
        let queryArr = [];
        for (let i = 0; i < itemList.length; i += 5) {
            const chunk = itemList.slice(i, i + 5);
            queryArr.push(chunk);
        }

        do {
            let arr = queryArr.splice(0, 1)[0]
            try {
                arr.map(i => {
                    getWorkItemId(i, larkService)
                        .then(async res => {
                            try {
                                await updateDate(i, res)
                            } catch (err) {
                                console.log('updateDate err:', err)
                            }
                        })
                        .catch((error) => {
                            console.log(error)
                            // return Promise.reject({ name: data.name, item: i, msg: error })
                        })
                })
            } catch (err) {
                console.log(err)
            }
            await delay(1200); // 等待500ms
        }
        while (queryArr.length > 0)
        return Promise.resolve({ name: data.name, msg: '批量处理' })
    }


    return Promise.allSettled(itemList.map(i => {
        return getWorkItemId(i, larkService)
            .then(async res => {
                try {
                    return await updateDate(i, res)
                } catch (err) {
                    console.log('updateDate err:', err)
                }
                // return updateDate(i, res, 0)
                //  Promise.resolve(data.name + ':success')
            })
            .catch((error) => {
                return Promise.reject({ name: data.name, item: i, msg: error })
            }); // 处理每个异步操作的错误
    })).then((res) => {
        // console.log('all success', res)
        const resItem = {
            name: data.name,
            res: res
        }
        writeFileSync(resItem, 3);
        if (res.some(item => item.status === 'rejected')) {
            return Promise.reject({
                name: data.name,
                msg: '处理失败:有工作项未找到'
            })
        } else {
            return Promise.resolve({
                name: data.name,
                msg: '处理成功'
            })
        }


    })

    // 获取工作项id
    async function getWorkItemId(item, larkService) {
        if (item.isLarkItem) {
            // 如果是飞书工作项 直接返回工作项id
            return Promise.resolve(item.pingcodeId)
        }
        let typeKey = '';
        let pingcodefileId = '';
        if (item.pingcodeId == undefined) {
            return Promise.reject('pingcodeId 不存在')
        }
        switch (item.type) {
            case '需求':
                typeKey = workItemEnum['需求管理']
                pingcodefileId = pingcodeIdEnum['需求']
                break
            case '缺陷':
                typeKey = workItemEnum['缺陷管理']
                pingcodefileId = pingcodeIdEnum['缺陷']
                break
        }
        // 查找对应工作项id
        let params = {
            "search_group": {
                "conjunction": "AND",
                "search_params": [
                    {
                        "param_key": pingcodefileId,
                        "value": item.pingcodeId,
                        "operator": "="
                    },

                ]
            }
        }
        let { data = [] } = await larkService.searchByParams(typeKey, params);
        if (data.length > 0) {
            return Promise.resolve(data[0].id)
        }
        return Promise.reject('未找到对应的工作项id')
    }
}


module.exports = {
    mergeFiles
}