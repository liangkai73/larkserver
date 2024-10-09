module.exports = {
    // 默认的创建人
    createUserKey: '7132723895836147715',
    // 项目映射
    projectMap: [
        // 测试项目
        {
            gitLabId: 1971,
            pingCodeScopeId: '63e366c8b1a0798ad33e139f',
            larkProjectKey: '667bc61ab77f92d209799c85'
        },
        // saas
        // Wshop  Store
        {
            gitLabId: 71,
            pingCodeScopeId: '619482548d15747865e84576',
            larkProjectKey: '64998d0966831488c85ee14c'
        },
        // Newshop admin
        {
            gitLabId: 577,
            pingCodeScopeId: '619b2b3e02f6108fa52d1698',
            larkProjectKey: '64998d0966831488c85ee14c'
        },
        // Mshop admin
        {
            gitLabId: 503,
            pingCodeScopeId: '619b2bf8efcd83676425ffe1',
            larkProjectKey: '64998d0966831488c85ee14c'
        },
        // Wp
        {
            gitLabId: 80,
            larkProjectKey: '64998d0966831488c85ee14c'
        }
    ],
    // 项目对应的默认的应用端选择
    defaultApplicationOptions: {
        // saas
        '667bc61ab77f92d209799c85': 'Wshop Store'
    },

    // files
    filesAliasEnum: {
        '引入版本': "create_version",
        '修复版本': 'repairedition'
    },
    // 版本管理 - 测试结论
    testResultEnum: {
        '不通过': "29yw3kiu5",
        "通过": "_z7jbzd96"
    },
    // 权重key
    quanzhongKey: 'field_f189df',
    // 应用端
    applicationKey: 'field_323bc6',
    // hotfixKey
    hotFixKey: 'field_81ed73',
    // 线上覆盖数 - 全量版本
    lineOverNum: 'field_066ee3',
    workItemEnum: {
        "缺陷管理": "645b5b8e4e1017a97c9069a3", // 测试
        "需求管理": "645b45bdc4888bbd733ffeda", // 测试
        "版本管理": "65d5a412c1e655a74ce02208",
    },
    // // 正式
    // workItemEnum: {
    //     "缺陷管理": "645b5b8e4e1017a97c9069a3", // 正式
    //     "需求管理": "645b45bdc4888bbd733ffeda", // 正式
    //     "版本管理": "65d5a412c1e655a74ce02208",
    // },
    // 业务线

    // pingcodeID-需求
    pingcodeIdEnum: {
        '需求': 'field_6b79ab', // 测试/正式
        '缺陷': 'field_bea996'  // 测试/正式
    },
    // 版本号fliedid
    versionNumber: 'field_353769'

}