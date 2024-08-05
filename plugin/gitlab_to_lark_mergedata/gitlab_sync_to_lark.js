
const { defaultApplicationOptions } = require("./config");

const gitlabSyncVersionToLark = async (larkKey, larkService, req, send) => {
    try {
        const { data: larkServiceType } = await larkService.allTypes();
        const versionManagement = larkServiceType.find((item) => item.name === '版本管理');
        const { data: itemOptions } = await larkService.getAllFieldByWorkItem(versionManagement.type_key);
        // 自定义参数
        const field_value_pairs = [];
        // 选择模板
        const templateOptions = itemOptions.find((item) => item.field_alias === 'template').options || [];
        // 选择应用端
        const applicationOptions = itemOptions.find((item) => item.field_alias === 'application').options || [];
        if (applicationOptions && defaultApplicationOptions[larkKey]) {
            const application = applicationOptions.find((item) => item.label === defaultApplicationOptions[larkKey]);
            if (application && application.value) {
                field_value_pairs.push({
                    field_alias: "application",
                    field_value: [{ value: application.value }]
                })
            }
        }
        await larkService.createWorkItem({
            work_item_type_key: versionManagement.type_key,
            name: req.name,
            template_id: templateOptions[0].value,
            field_value_pairs
        }, '7132723895836147715')
        return send({
            success: true,
            message: '创建成功'
        });
    } catch (e) {
        console.log('e===========>', e);
        return send({
            success: false,
            message: JSON.stringify(e)
        });
    }
}

module.exports = {
    gitlabSyncVersionToLark
}
