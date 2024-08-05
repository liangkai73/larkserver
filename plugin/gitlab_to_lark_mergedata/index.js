var getRawBody = require('raw-body');
const Axios = require('axios');
const LarkProjectService = require('../../service/larkProject');

const { projectMap, workItemMap, workItemEnum } = require("./config");
const { getDescItem } = require("./utils");
const { mergeFiles } = require("./mergeFiles");

module.exports.handler = function (req, resp, context) {
    const send = (data) => resp.send(JSON.stringify(data));
    // 获取飞书服务
    const getLarkService = async (lark_project_key) => {
        const projectToken = await LarkProjectService.refreshAccessToken();
        const projectService = await new LarkProjectService(projectToken, lark_project_key);
        return projectService;
    }

    /**
     * 入口
     */
    getRawBody(req, async function (err, body) {
        resp.setHeader('content-type', 'application/json');
        if (!body) {
            return send({
                success: false,
                message: 'body为空, body empty'
            });
        }
        const data = JSON.parse(body);
        const larkKey = projectMap.find((item) => item.gitLabId === data.project.id) ? projectMap.find((item) => item.gitLabId === data.project.id).LarkProjectKey : '';
        if (!larkKey) {
            return send({
                success: false,
                message: '飞书空间未配置请查看'
            });
        }
        const larkService = await getLarkService(larkKey);
        // TODO:删除update
        if (data.object_kind === 'release' && data.action === 'create' || data.action === 'update') {
            mergeFiles(larkService, data)
            //  更新飞书项目 (id)=> void
            return send({
                success: true,
                message: 'yes'
            });
        }
    });
}
