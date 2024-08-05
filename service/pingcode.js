// https://open.pingcode.com/
const Axios = require('axios');
const map = require('lodash/map');
const pick = require('lodash/pick');
const config = require('../config/webhooks');

class PingCodeService {
  constructor(token) {
    const axios = Axios.create({
      baseURL: config.pingCodeApi,
      headers: {
        Authorization: token,
      }
    });

    axios.interceptors.response.use(res => {
      return res.data;
    });

    this.axios = axios;
  }

  static async refreshAccessToken() {
    try {
      const res = await Axios.get(`${config.pingCodeApi}auth/token`, {
        params: {
          grant_type: 'client_credentials',
          client_id: config.pingCodeId,
          client_secret: config.pingCodeSecret,
        },
      });
      if (res.data.access_token) return `Bearer ${res.data.access_token}`;
      return null;
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * 查询多页数据
   * @description 每页请求失败最多重试十次
   * @param this helper
   * @param url api地址
   * @param params 查询参数
   * @return {any} 查询列表
   */
  async fetchList(url, params, props) {
    let list = [], tryTime = 0;

    console.log('fetch:', url, 'page:', 0);
    const fetchFirstPage = () => this.axios.get(url, {
      params: {
        page_size: 100,
        page_index: 0,
        ...params,
      },
    }).catch(async () => {
      if (tryTime < 10) {
        console.log(`fetch: ${url} page: 0 fail, retry: ${tryTime + 1} time`);
        tryTime++;
        return await fetchFirstPage();
      }
      throw new Error(`fetch: ${url}, page: 0 fail`);
    });
    const firstPage = await fetchFirstPage();
    let values = firstPage.values;
    if (props) values = map(values, i => pick(i, props));
    list = [...values];
    const totalPage = Math.floor(firstPage.total / 100);
    const fetchFn = (page, tryCount) => this.axios.get(url, {
      params: {
        page_size: 100,
        page_index: page,
        ...params,
      },
    }).then(res => {
      let values = res.values;
      if (props) values = map(values, i => pick(i, props));
      list = [...list, ...values];
    }).catch(async () => {
      if (tryCount < 10) {
        console.log(`fetch: ${url} page: ${page + 1} fail, retry: ${tryCount + 1} time`);
        await fetchFn(page, ++tryCount);
      } else {
        throw new Error(`fetch: ${url}, page: ${page + 1} fail`);
      }
    });
    for (let page = 0; page < totalPage;) {
      console.log('fetch:', url, 'page:', page + 1);
      await fetchFn(++page, 0);
    }

    return list;
  }

  /**
 * 查看测试计划
 * @param id 测试库ID
 * @param plan_id 测试计划ID
 * @returns {Promise<>}
 */
  async getTestPlan(id, plan_id) {
    return this.axios.get(`testhub/libraries/${id}/plans/${plan_id}`);
  }

  /**
   * 创建测试计划
   * @param id 测试库ID
   * @param data 创建参数
   * @returns {Promise<>}
   */
  async createTestPlan(id, data) {
    return this.axios.post(`testhub/libraries/${id}/plans`, data);
  }

  /**
   * 创建运行用例
   * @param libId 测试库ID
   * @param pid 测试计划ID
   * @param data 创建参数
   */
  async createTestRunCase(libId, pid, data) {
    return this.axios.post(`testhub/libraries/${libId}/plans/${pid}/runs`, data);
  }

  /**
   * 创建运行用例关联
   * @param libId 测试库ID
   * @param pid 测试计划ID
   * @param rid 运行用例ID
   * @param data 创建参数
   */
  async createTestRunCaseRelation(libId, pid, rid, data) {
    return this.axios.post(`testhub/libraries/${libId}/plans/${pid}/runs/${rid}/relations`, data);
  }

  /**
   * 创建测试用例关联
   * @param id 测试用例ID
   * @param data 创建参数
   */
  async createTestCaseRelation(id, data) {
    return this.axios.post(`testhub/cases/${id}/relations`, data);
  }

  /** 获取bug列表
  * @param id 项目ID
  */
  async getBugList(id, index, state_id) {
    return this.axios.get(`agile/work_items?project_id=${id}&page_index=${index}&type=bug&page_size=100&state_id=${state_id}`);
  }

  /**
   * 获取工作项列表
   */
  async getWorkItemList(id, type, index, size) {
    return this.axios.get(`agile/work_items?project_id=${id}&page_index=${index}&type=${type}&page_size=${size}`);
  }

  /**
   * 获取工作项
   * @param id 工作项ID
   */
  async getWorkItem(id) {
    return this.axios.get(`agile/work_items/${id}`);
  }

  /**
   * 获取工作项 根据编号
   * @param identifier 工作项编号
   */
  async getWorkItemByIdentifier(identifier) {
    return this.axios.get(`project/work_items?identifier=${identifier}`);
  }

  /**
   * 更新工作项
   * @param type 工作项类型
   * @param id 工作项ID
   */
  async updateWorkItem(type, id, data) {
    let url;
    switch (type) {
      case 'bug':
        url = 'agile/bugs/';
        break;
      case 'task':
        url = 'agile/tasks/';
        break;
      case 'story':
        url = 'agile/stories/';
        break;
      case 'feature':
        url = 'agile/features/';
        break;
      case 'epic':
        url = 'agile/epics/';
        break;
      default:
        break;
    }
    return this.axios.patch(`${url}${id}`, data);
  }

  getUser(id) {
    return this.axios.get(`directory/users/${id}`);
  }

  /**
   * 获取子工作项列表
   * @param parent_id 父工作项的id
   */
  async getSubWorkItemList(parent_id) {
    return this.axios.get(`agile/work_items`, {
      params: {
        parent_id
      },
    });
  }

  /**
   * 获取工作项列表
   */
  async getItemList(params) {
    return this.axios.get(`agile/work_items`, {
      params
    });
  }


  /**
   * 获取一个版本
   * @param project_id 项目的id
   * @param version_id 版本的id
   * @returns {Promise<void>}
   */
  async getReplayVersionDetail(project_id, version_id) {
    return await this.axios.get(`project/projects/${project_id}/versions/${version_id}`);
  }

  /**
   * 获取一个工作项的评论
   * @param work_item_id
   * @param params
   */
  getCommentsList(work_item_id, params) {
    return this.axios.get(`agile/work_items/${work_item_id}/comments`, {
      params
    });
  }

  /**
   * 添加一个工作项的评论
   * @param work_item_id
   * @param data
   */
  addComment(work_item_id, data) {
    return this.axios.post(`agile/work_items/${work_item_id}/comments`, data);
  }

  /**
 * 添加一个评论
 * @param data
 */
  createComment(data) {
    return this.axios.post(`/comments`, data);
  }

  /**
   * 获取工作项附件列表
   *
   */
  getWorkItemAttachmentsList(work_item_id) {
    return this.axios.get(`agile/work_items/${work_item_id}/attachments`);
  }

  /**
   * 获取评论附件列表
   * comment_id
   */
  getCommentAttachmentsList(work_item_id, comment_id) {
    return this.axios.get(`agile/work_items/${work_item_id}/comments/${comment_id}/attachments`);
  }

  /**
   * 获取工作项关联列表
   * @param work_item_id
   */
  getWorkItemRelations(work_item_id) {
    return this.axios.get(`agile/work_items/${work_item_id}/relations`);
  }

  /**
   * 获取迭代列表
   */
  getSprintsList(project_id, params) {
    return this.axios.get(`project/projects/${project_id}/sprints`, {
      params
    });
  }

  /**
   * 获取发布列表
   */
  getReleasesList(project_id, params) {
    return this.axios.get(`project/projects/${project_id}/versions`, {
      params
    });
  }

  getProperties(params) {
    return this.axios.get(`project/properties`, {
      params: {
        page_size: 100,
        ...params
      }
    });
  }

  // 获取项目列表
  getProjectProjects(params) {
    return this.axios.get(`project/projects`, { params });
  }

  getWorkItemProperties(params) {
    return this.axios.get(`project/work_item/properties`, { params });
  }

  // pingcode获取项目中的成员列表
  getPCMembers(project_id, params) {
    return this.axios.get(`project/projects/${project_id}/members`, {
      params
    });
  }

    // 获取测试库列表
    getTestPlanCase(params) {
      return this.axios.get(`testhub/runs`, { params });
    }
}

module.exports = PingCodeService;
