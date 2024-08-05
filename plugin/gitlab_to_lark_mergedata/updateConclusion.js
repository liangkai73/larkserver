const { versionToWeight } = require('./utils');
const { projectMap, workItemMap, workItemEnum, filesAliasEnum, testResultEnum, quanzhongKey, applicationKey, hotFixKey, lineOverNum } = require("./config");
const LarkProjectService = require('../../service/larkProject');

async function updateConclusion(body, larkInterface) {
    let larkService
    // 获取飞书服务
    const getLarkService = async (lark_project_key) => {
        const projectToken = await LarkProjectService.refreshAccessToken();
        const projectService = await new LarkProjectService(projectToken, lark_project_key);
        return projectService;
    }
    if (larkInterface) {
        larkService = larkInterface
    } else {
        const larkKey = '667bc61ab77f92d209799c85'
        larkService = await getLarkService(larkKey);
    }

    const { id: itemId } = body.payload;
    const createValueArr = await getFileValue(larkService, workItemEnum['缺陷管理'], itemId, filesAliasEnum['引入版本'])
    const fixValueArr = await getFileValue(larkService, workItemEnum['缺陷管理'], itemId, filesAliasEnum['修复版本'])
    // 错误数据类型过滤
    if (createValueArr.length == 0 || fixValueArr.length == 0) {
        console.log('原数据缺失-执行中断')
        return

    }
    if (fixValueArr.length < createValueArr.length) {
        console.log('原数据缺失-修复版本少于引入版本-执行中断')
        return
    }
    const pramas = {
        "work_item_ids": [
            ...createValueArr, ...fixValueArr
        ]
    }
    const mergeItemInfoArr = await getItemInfo(larkService, workItemEnum['版本管理'], pramas);
    //    引入版本iteminfo数组
    let createItemInfoArr = mergeItemInfoArr.filter(i => {
        return createValueArr.includes(i.id)
    })
    //    修复版本iteminfo数组
    let fixItemInfoArr = mergeItemInfoArr.filter(i => {
        return fixValueArr.includes(i.id)
    })
    if (createItemInfoArr.filter(node => !node.is_hotfix).length == 0) {
        console.log('原数据缺失-引入版本nomal为空-执行中断')
        return
    }
    //   判断是否hotfix版本 - 引入
    const isHotfix = createItemInfoArr.some(item => item.is_hotfix);
    // 需要修改为成功的hotfixId
    let hotfixPassArr = [];

    if (isHotfix) {
        const cArr_h = createItemInfoArr.filter(i => i.is_hotfix);
        const fArr_h = fixItemInfoArr.filter(i => i.is_hotfix);
        if (fArr_h.length == cArr_h.length) {
            const hotFixIdArr = await getUpdateItemIdArr(larkService, cArr_h, fArr_h, 'hotfix');
            // 更新为不通过
            const params_h = {
                "update_fields": [
                    {
                        "field_alias": "test_result",
                        "field_value": {
                            "value": testResultEnum['不通过']
                        }
                    },
                    {
                        "field_alias": "auto_updated",
                        "field_value": new Date().getTime()
                    }
                ]
            }
            await updateVersionItem(larkService, hotFixIdArr, params_h, '设置hotfix不通过');
            // hotfix修正
            hotfixPassArr = fixItemInfoArr.filter(i => i.is_hotfix);
        } else {
            console.log('hotfix修复版本数量与引入版本不匹配- 暂不支持-执行跳过')
        }

        // 过滤 createItemInfoArr / fixItemInfoArr 中的hotfix

        createItemInfoArr = createItemInfoArr.filter(i => !i.is_hotfix);
        fixItemInfoArr = fixItemInfoArr.filter(i => !i.is_hotfix);
    }

    const normalIdArr = await getUpdateItemIdArr(larkService, createItemInfoArr, fixItemInfoArr)
    const passArr = fixItemInfoArr.map(i => i.id)

    // 更新为不通过
    let temTime = new Date().getTime();
    const params_n = {
        "update_fields": [
            {
                "field_alias": "test_result",
                "field_value": {
                    "value": testResultEnum['不通过']
                }
            },
            {
                "field_alias": "auto_updated",
                "field_value": temTime
            }
        ]
    }
    // 更新为通过
    const params_p = {
        "update_fields": [
            {
                "field_alias": "test_result",
                "field_value": {
                    "value": testResultEnum['通过']
                }
            },
            {
                "field_alias": "auto_updated",
                "field_value": temTime
            }
        ]
    }
    await updateVersionItem(larkService, normalIdArr, params_n, '设置不通过')
    await updateVersionItem(larkService, [...hotfixPassArr.map(n => n.id), ...passArr], params_p, '设置通过')
}
// 过滤全量类型
async function filterGloble(larkService, baseArr) {
    let resArr = formateArrInfo(baseArr)
    // 权重从小到大排序
    resArr = resArr.sort((a, b) => {
        return a.version_weights * 1 - b.version_weights * 1
    })

    if (resArr.length < 1) {
        return resArr
    }
    // console.log(resArr)
    let params = {
        "search_group": {
            "conjunction": "AND",
            "search_params": [
                {
                    "param_key": applicationKey,
                    "value": resArr[0].application,
                    "operator": "="
                },
                {
                    "param_key": quanzhongKey,
                    "value": resArr[0].version_weights,
                    "operator": ">="
                },
                {
                    "param_key": quanzhongKey,
                    "value": resArr[resArr.length - 1].version_weights,
                    "operator": "<="
                },
                {
                    "param_key": lineOverNum,
                    "value": "全量",
                    "operator": "="
                },
            ]
        }
    }

    let { data = [] } = await larkService.searchByParams(workItemEnum['版本管理'], params)
    // 筛选最大全量
    data = formateArrInfo(data);
    const globleArr = data.sort((a, b) => {
        return b.version_weights * 1 - a.version_weights * 1
    })
    let newResArr = resArr
    if (globleArr.length > 0) {
        const globleItem = globleArr[0];
        console.log('区间存在全量版本：' + globleItem.name + '。版本权重：' + globleItem.version_weights)
        newResArr = resArr.filter(i => {
            i.version_weights <= globleItem.version_weights && console.log(`${i.name}[${i.version_weights}<=${globleItem.version_weights}]【过滤】`)
            return i.version_weights > globleItem.version_weights
        })
    }
    console.log('排除全量版本余留id组---------------------------------:')
    console.log(newResArr)
    return newResArr


}
// 获取需要更新的idarr
async function getUpdateItemIdArr(larkService, cArr, fArr, type = 'nomal') {
    let startId, endId, roleType, reSultArr = [], params;
    const logItem = {
        filterRule: [],
        isBreak: false,
        reSultArr: [],
    }

    if (cArr.length == 1) {
        if (fArr.length == 1) {
            roleType = 1;
        } else if (fArr.length > 1) {
            roleType = 2
        }
    } else if (cArr.length > 1) {
        roleType = 3
    }
    // 获取需要不通过的版本
    switch (roleType) {
        // 引入版本为单个&修复版本为单个
        case 1:
            params = {
                "search_group": {
                    "conjunction": "AND",
                    "search_params": [
                        {
                            "param_key": applicationKey,
                            "value": cArr[0].application,
                            "operator": "="
                        },
                        {
                            "param_key": quanzhongKey,
                            "value": cArr[0].version_weights,
                            "operator": ">="
                        },
                        {
                            "param_key": quanzhongKey,
                            "value": fArr[0].version_weights,
                            "operator": "<"
                        }
                    ]
                }
            }
            if (type == 'hotfix') {
                params.search_group.search_params.push({
                    "param_key": hotFixKey,
                    "value": true,
                    "operator": "="
                })
            }
            // console.dir(params.search_group);
            const res = await larkService.searchByParams(workItemEnum['版本管理'], params)
            reSultArr = res.data
            // console.log(reSultArr)
            break
        // 引入版本为单个&修复版本为多个
        case 2:
            const sortfArr = fArr.sort((a, b) => {
                return b.version_weights * 1 - a.version_weights * 1
            })

            params = {
                "search_group": {
                    "conjunction": "AND",
                    "search_params": [
                        {
                            "param_key": applicationKey,
                            "value": cArr[0].application,
                            "operator": "="
                        },
                        {
                            "param_key": quanzhongKey,
                            "value": cArr[0].version_weights,
                            "operator": ">="
                        },
                        {
                            "param_key": quanzhongKey,
                            "value": fArr[0].version_weights,
                            "operator": "<"
                        }
                    ]
                }
            }
            const res2 = await larkService.searchByParams(workItemEnum['版本管理'], params)
            reSultArr = res2.data
            break
        // 引入版本为多个&修复版本为多个
        case 3:
            if (fArr.length < cArr.length) {
                break
            }
            const cArr_clone = cArr.map(i => {
                let str = i.version_weights.toString()
                i.versionFix = str.slice(0, -7);
                // console.log('fix版本权重:' + i.versionFix)
                return i
            })
            const fArr_clone = fArr.map(i => {
                let str = i.version_weights.toString()
                i.versionFix = str.slice(0, -7);
                // console.log('fix版本权重:' + i.versionFix)
                return i
            })
            let resNode = [];

            for (let i = 0; i < cArr_clone.length; i++) {
                let params = {
                    "search_group": {
                        "conjunction": "AND",
                        "search_params": [
                            {
                                "param_key": applicationKey,
                                "value": cArr_clone[i].application,
                                "operator": "="
                            },
                            {
                                "param_key": quanzhongKey,
                                "value": cArr_clone[i].version_weights,
                                "operator": ">="
                            },
                            {
                                "param_key": quanzhongKey,
                                "value": fArr_clone.filter(item => item.versionFix == cArr_clone[i].versionFix)[0].version_weights,
                                "operator": "<"
                            }
                        ]
                    }
                }
                // console.log(fArr_clone.filter(item => item.versionFix == cArr[i].versionFix))
                console.dir(cArr_clone[i].version_weights)
                const res3 = await larkService.searchByParams(workItemEnum['版本管理'], params);
                resNode = [...resNode, ...res3.data]
                console.log(resNode)
            }
            reSultArr = resNode

            break
    }
    reSultArr = await filterGloble(larkService, reSultArr)
    console.log(reSultArr)
    return reSultArr.map(i => i.id)
}
/**
 * @description 批量修改- 版本管理 工作项files
 * @param {*} larkService 
 * @param {*} itemidArr 
 * @param {*} params 
 */
async function updateVersionItem(larkService, itemidArr, params, log = '默认日志') {
    console.log('预计更新总id组:' + itemidArr);
    // 批量限制10
    queryArr = [];
    for (let i = 0; i < itemidArr.length; i += 10) {
        const chunk = itemidArr.slice(i, i + 10);
        queryArr.push(chunk);
    }

    const updateFun = async (larkService, arr, params, log) => {
        console.log('预计更新片段:' + arr);
        const asyncArr = [];
        arr.forEach(id => {
            asyncArr.push(larkService.updateWorkItem(workItemEnum['版本管理'], id, params).then(res => {
                console.log(id + log + ':success')
            }).catch(err => {
                console.log(id + log + ':error')
            }))
        });
        return Promise.all(asyncArr)
    };

    do {
        let arr = queryArr.splice(0, 1)[0]
        await updateFun(larkService, arr, params, log)
    }
    while (queryArr.length > 0)
}

/**
 * @description 获取files对应的alias数组
 * @param {*} larkService 
 * @param {*} workItemkey 
 * @param {*} workItemId 
 * @param {*} alias 
 * @returns 
 */
async function getFileValue(larkService, workItemkey, workItemId, alias) {
    let res
    const params = {
        "work_item_ids": [
            workItemId
        ]
    }
    const { data = [] } = await larkService.getWorkItemQuery(workItemkey, params);

    const fields = data[0]?.fields || []
    const valueArr = fields.filter(i => {
        return i.field_alias == alias
    })
    let value = []
    if (valueArr.length > 0) {
        value = valueArr[0].field_value
    }

    return value

}

/**
 * @description 获取工作项详情
 * @param {*} larkService 
 * @param {*} workItemkey 
 * @param {*} params 
 * @returns 
 */
async function getItemInfo(larkService, workItemkey, params) {
    const { data = [] } = await larkService.getWorkItemQuery(workItemkey, params);
    const ItemData = data.map(i => {
        let obj = i.fields.filter(res => {
            return res.field_alias == 'version_weights'
        })
        let obj2 = i.fields.filter(res => {
            return res.field_alias == 'is_hotfix'
        })
        let obj3 = i.fields.filter(res => {
            return res.field_alias == 'application'
        })
        return { ...i, version_weights: obj[0].field_value, version_weights_key: obj[0].field_key, is_hotfix: obj2[0].field_value, application: [obj3[0].field_value[0].value] }
    })
    return ItemData
}

// 数据过滤
function formateArrInfo(arr) {
    return arr.map(item => {
        const tem = item;
        let obj = item.fields.filter(res => {
            return res.field_alias == 'version_weights'
        })
        let obj2 = item.fields.filter(res => {
            return res.field_alias == 'is_hotfix'
        })
        let obj3 = item.fields.filter(res => {
            return res.field_alias == 'application'
        })
        return { ...tem, version_weights: obj[0].field_value, version_weights_key: obj[0].field_key, is_hotfix: obj2[0].field_value, application: [obj3[0].field_value[0].value] }
    })
}




module.exports = {
    updateConclusion
}