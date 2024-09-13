// 迁移gitlab-项目71 577 503
const { larkFix } = require('./larkFix');
const { default: axios } = require("axios")
const { mergeFiles } = require('./tempMergeFiles');
const { writeFileSync } = require('./fsData')
const LarkProjectService = require('../../service/larkProject');

const tempRes = [];
const allTemRes = [];
async function temMigrate(id, page = 1) {
    let pageObj = {
        page: page,
        per_page: 100,///
    }
    const param = {
        method: 'get',
        headers: { 'Content-Type': 'application/json;charset=UTF-8', 'PRIVATE-TOKEN': 'mEyx8CaGvWrXBoXhira8' },
        url: `https://git.papamk.com/api/v4/projects/${id}/releases`,
        params: pageObj
    }
    axios(param).then(async (result) => {
        console.log(`Page ${page}:`, result.data);
        if (result.data.length === pageObj.per_page && !hasBoundaryVersion(result.data)) {
            temMigrate(id, page + 1); // 请求下一页
            allTemRes.push(...result.data);
            console.log(allTemRes.length)
        } else {
            console.log('allTemRes:', allTemRes);
            console.log('tempRes:', tempRes);
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

            larkFix(larkService, tempRes, id).then(async (res) => {
                console.log('versionInfoArr', res);

                // 批量限制10
                // let queryArr = [];
                // for (let i = 0; i < res.length; i += 5) {
                //     const chunk = res.slice(i, i + 5);
                //     queryArr.push(chunk);
                // }

                queryArr = res

                const updateFun = async (larkService, arr) => {
                    const asyncArr = [];
                    arr.forEach(item => {
                        asyncArr.push(
                            mergeFiles(larkService, item, item.versionId).then(res => {
                                // console.log(res)
                                return Promise.resolve(res)
                            }).catch(err => {
                                // console.log(err)
                                return Promise.reject(err)
                            })
                        )
                    });
                    return Promise.all(asyncArr)
                };

                function delay(time) {
                    return new Promise(resolve => setTimeout(resolve, time));
                }
                do {
                    let arr = queryArr.splice(0, 1)[0]
                    let logs = '';
                    try {
                        const res = await updateFun(larkService, [arr]);
                        logs = res[0]
                        console.log(res[0], 'over------------------------')
                    } catch (err) {
                        logs = err
                        console.log(err, 'errover------------------------')
                    }
                    writeFileSync(logs, 4);
                    await delay(1200); // 等待500ms
                }
                while (queryArr.length > 0)
                console.log('allend')

            })
        }
    }).catch((err) => {
        console.log(err)
    });

}
// 判断是否包含边界版本号
function hasBoundaryVersion(data) {
    // const boundaryVersion = 'v1.10'
    // const boundaryVersion = 'v1.46.0-beta.1'
    const boundaryVersion = 'v1.48.0-beta.3'
    let res = false;
    let length = data.length
    for (let i = 0; i < length; i++) {
        !isfileterVersion(data[i]) && tempRes.push(data[i]) && writeFileSync({ name: data[i]?.tag_name, desc: data[i]?.description, time: data[i]?.created_at }, 2);
        if (data[i].tag_name === boundaryVersion) {
            res = true;
            break;
        }
    }
    return res
}
// 过滤不符合要求的版本号
function isfileterVersion(data) {
    let versionName = data.tag_name;
    // 检查versionName是否不包含'v1.46'、'v1.47'或者'v1.48' 
    if (!versionName.includes('v1.46') && !versionName.includes('v1.47') && !versionName.includes('v1.48')) {
        return true; // 不包含这些版本，返回true
    }
    // // mshop专用
    // if (!versionName.includes('v1.10')) {
    //     return true; // 不包含这些版本，返回true
    // }
    // 如果第一位是'v'，去除第一位
    if (versionName.startsWith('v')) {
        versionName = versionName.slice(1);
    }
    // 检查description是否包含'{无效版本}'
    if (data.description.includes('{无效版本}')) {
        return true; //
    }
    if (/[A-Za-z]/.test(versionName)) {
        if (/(?:-beta)|(-h)/.test(versionName)) {
            return false; // 包含 '-beta' 或 '-h'
        } else {
            return true; // 不包含
        }
    } else {
        return false
    }
}
module.exports = { temMigrate } 