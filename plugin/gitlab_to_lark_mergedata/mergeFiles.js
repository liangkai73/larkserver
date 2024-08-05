const { projectMap, workItemMap, workItemEnum } = require("./config");
const { getDescItem } = require("./utils");

// 合并版本号&合并请求链接
/**
 * 
 * @param {*} larkService 飞书服务实例
 * @param {*} data gitlab-webhooks返回的data 
 * @param {*} id 版本管理-工作项id
 */
function mergeFiles(larkService, data, id = 4423270747) {
    //  gitlab数据处理 -（）=> 需求-缺陷-版本号-飞书项目id
    const description = data.description;
    const project = data.project;
    const itemList = getDescItem(description);

    if (itemList.length == 0) {
        return send({
            success: false,
            message: '未匹配到对应的版本号-需求id'
        });
    }
    //  计算链接排序index
    function getMergeLink(str, newUrl) {
        const regex = new RegExp('\n', 'g');
        const index = (str.match(regex) || []).length;
        return str + `${index + 1}. ${newUrl}`
    }
    // 更新工作项-function
    function updateDate(i = {}) {
        const gitlabUrlStr = project.web_url + `/-/merge_requests/${i.mergeId}\n`;
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
        larkService.getWorkItemQuery(typeKey, { "work_item_ids": [i.ItemId] }).then(res => {
            const { fields } = res.data[0];

            const mergeVersion = fields.filter(i => {
                return i.field_alias == 'merge_version'
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
                        "field_alias": "merge_version",
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
            larkService.updateWorkItem(typeKey, i.ItemId, updateParams).then(res => {
                console.log(type + '更新成功！------------------------' + i.ItemId)
            }).catch(err => {
                console.log(type + '更新失败！------------------------' + i.ItemId)
            })
            larkService.updateWorkItem(typeKey, i.ItemId, updateParams2).then(res => {
                console.log(type + '更新成功！------------------------' + i.ItemId)
            }).catch(err => {
                console.log(type + '更新失败！------------------------' + i.ItemId)
            })
        })

    }
    // 遍历更新工作项
    itemList.map(i => {
        updateDate(i)
    })
}


module.exports = {
    mergeFiles
}