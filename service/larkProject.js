const Axios = require('axios');
const fs = require("fs");
const FormData = require('form-data');
const map = require("lodash/map");
const pick = require("lodash/pick");

const serviceParams = {
  // project_key: "63d8b99f74aaec42a602e8cd", // 一页商店
  // project_key: "63ec763e7b030364922f742b", // saas控制中心
  // project_key: "63edf40162b76c96c5fbd57e", // pp_query
  // project_key: "63edf47378c45439d5bc945a", // pp-report
  // project_key: "63edf4d762b76c96c5fbd580", // creditcard-crawler
  // project_key: "63edf54e92d7044cf4bb299b", // freshdesk-tag
  // project_key: "63edf5902c435a5cf0ff77d1", // paypal-automation
  // project_key: "63edf66878c45439d5bc945b", // 帖子助手
  // project_key: "63edf6d962b76c96c5fbd581", // 主页售后评分
  // project_key: "63edfc4a62b76c96c5fbd583", // PayPal Cluster
  // project_key: "63edfd0217c6ab1823e64cdf", // 产品运营中心
  // project_key: "63edfd7992d7044cf4bb299d", // 数据2组需求
  // project_key: "63edfddcdac29d283b2de3f0", // 数据1组-大数据开发
  // project_key: "63edff1a17c6ab1823e64ce0", // 数据一组广告自动投放
  // project_key: "63ee0114dac29d283b2de3f1", // FB个人号需求
  // project_key: "63edffd592d7044cf4bb299f", // 订单数据支持
  // project_key: "63edfed12c435a5cf0ff77d3", // 数据一组需求池
  // project_key: "63edfe3d92d7044cf4bb299e", // 数据1组-sku管理
  // project_key: "63edff6578c45439d5bc945f", // fb资产管理
  project_key: null,
  base_url: "https://project.feishu.cn",
  plugin_id: "MII_63D71DFFD602C01C",
  plugin_secret: "0E789188B2E0954FAE0EDE4BA7A96909"
  //
  // plugin_id: "MII_63F31617A402C004", // fanxi科技
  // plugin_secret: "6847CAF46BEB161376355FC1466E077F"
}

class LarkProjectService {
  constructor(token, key) {
    serviceParams.project_key = key
    const axios = Axios.create({
      baseURL: serviceParams.base_url,
      headers: {
        'X-PLUGIN-TOKEN': token,
        'X-USER-KEY': "7132723895836147715"
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    axios.interceptors.response.use(res => {
      return res.data;
    });

    this.axios = axios;
  }

  static async refreshAccessToken() {
    try {
      const res = await Axios.post(`${serviceParams.base_url}/bff/v2/authen/plugin_token`, {
        plugin_id: serviceParams.plugin_id,
        plugin_secret: serviceParams.plugin_secret,
        type: 0
      });
      if (res.data.data.token) return res.data.data.token;
      return null;
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * 查询多页数据
   * @description 每页请求失败最多重试十次
   * @param p_url
   * @param body
   * @param props
   * @return {any} 查询列表
   */
  async fetchList(p_url, body, props) {
    let list = [], tryTime = 0;
    const url = `/open_api/${serviceParams.project_key}/${p_url}`
    console.log('fetch:', url, 'page:', 0);
    const fetchFirstPage = () => this.axios.post(url, {
      page_size: 100,
      page_num: 1,
      ...body,
    }).catch(async () => {
      if (tryTime < 10) {
        console.log(`fetch: ${url} page: 0 fail, retry: ${tryTime + 1} time`);
        tryTime++;
        return await fetchFirstPage();
      }
      throw new Error(`fetch: ${url}, page: 0 fail`);
    });
    const firstPage = await fetchFirstPage();
    let values = firstPage.data;
    if (props) values = map(values, i => pick(i, props));
    list = [...values];
    const totalPage = Math.floor(firstPage.pagination.total / 100);
    const fetchFn = (page, tryCount) => this.axios.post(url, {
      page_size: 100,
      page_num: page,
      ...body,
    }).then(res => {
      let values = res.data;
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

    for (let page = 1; page < totalPage + 1;) {
      console.log('fetch:', url, 'page:', page + 1);
      await fetchFn(++page, 0);
    }
    return list;
  }


  /**
   * 创建工作项
   */
  async createWorkItem(data, creator_key) {
    try {
      return this.axios.post(`/open_api/${serviceParams.project_key}/work_item/create`, data, { headers: { 'X-USER-KEY': creator_key } });
    } catch (e) {
      return this.axios.post(`/open_api/${serviceParams.project_key}/work_item/create`, data, { headers: { 'X-USER-KEY': "7193925698380251137" } })
    }
  }

  /**
   * 更新工作项
   */
  async updateWorkItem(work_item_type_key, id, data) {
    return this.axios.put(`/open_api/${serviceParams.project_key}/work_item/${work_item_type_key}/${id}`, data);
  }

  /**
   * 更新工作项
   */
  async updateWorkItemByUser(work_item_type_key, id, data, updater_key) {
    return this.axios.put(`/open_api/${serviceParams.project_key}/work_item/${work_item_type_key}/${id}`, data, { headers: { 'X-USER-KEY': updater_key } });
  }

  /**
   * 获取用户详情
   */
  async getUserQuery(data) {
    return this.axios.post(`/open_api/user/query`, data);
  }

  /**
   * 筛选获取工作项
   */
  async getWorkItemList(data) {
    return this.axios.post(`/open_api/${serviceParams.project_key}/work_item/filter`, data);
  }

  /**
   * 添加评论
   */
  async addComment(work_item_type_key, id, data, creator_key) {
    return this.axios.post(`/open_api/${serviceParams.project_key}/work_item/${work_item_type_key}/${id}/comment/create`, data, {
      headers: {
        'X-USER-KEY': creator_key
      }
    });
  }

  /**
   * 更新节点/排期
   */
  async updateNode(work_item_type_key, id, node_id, data) {
    return this.axios.put(`/open_api/${serviceParams.project_key}/workflow/${work_item_type_key}/${id}/node/${node_id}`, data);
  }

  /**
   * 状态扭转
   */
  async stateChange(work_item_type_key, id, data) {
    return this.axios.post(`/open_api/${serviceParams.project_key}/workflow/${work_item_type_key}/${id}/node/state_change`, data);
  }

  /**
   * 获取工作流详情
   */
  async workflowQuery(work_item_type_key, id, data) {
    return this.axios.post(`/open_api/${serviceParams.project_key}/work_item/${work_item_type_key}/${id}/workflow/query`, data);
  }


  /**
   * 获取空间字段
   */
  async getAllField() {
    return this.axios.post(`/open_api/${serviceParams.project_key}/field/all`);
  }

  /**
 * 通过工作项类型获取空间字段
 */
  async getAllFieldByWorkItem(work_item_type_key) {
    return this.axios.post(`/open_api/${serviceParams.project_key}/field/all`, { work_item_type_key });
  }


  /**
   * 获取工作项详情
   */
  async getWorkItemQuery(work_item_type_key, data) {
    return this.axios.post(`/open_api/${serviceParams.project_key}/work_item/${work_item_type_key}/query`, data);
  }

  /**
   * 获取工作流详情
   */
  async getWorkflowQuery(work_item_type_key, id) {
    return this.axios.post(`/open_api/${serviceParams.project_key}/work_item/${work_item_type_key}/${id}/workflow/query`);
  }

  /**
   * 完成节点/回滚
   */
  async nodeOperate(work_item_type_key, workItem_id, node_id, data) {
    return this.axios.post(`/open_api/${serviceParams.project_key}/workflow/${work_item_type_key}/${workItem_id}/node/${node_id}/operate`, data);
  }

  /**
   * 获取空间下的工作项类型
   */
  async allTypes() {
    return this.axios.get(`/open_api/${serviceParams.project_key}/work_item/all-types`);
  }

  /**
   * 获取工作项关联
   */
  async searchByRelation(work_item_type_key, workItem_id, data) {
    return this.axios.post(`/open_api/${serviceParams.project_key}/work_item/${work_item_type_key}/${workItem_id}/search_by_relation`, data);
  }

  /**
   * 复杂搜索
   */
  async searchByParams(work_item_type_key, data) {
    return this.axios.post(`/open_api/${serviceParams.project_key}/work_item/${work_item_type_key}/search/params`, data);
  }

  /**
   * 获取评论
   */
  async getComments(work_item_type_key, workItem_id) {
    return this.axios.get(`/open_api/${serviceParams.project_key}/work_item/${work_item_type_key}/${workItem_id}/comments`);
  }

  /**
   * 添加字段
   */
  async addField(work_item_type_key, data) {
    return this.axios.put(`/open_api/${serviceParams.project_key}/field/${work_item_type_key}`, data);
  }

  // 获取所有的业务线
  async getAllBusiness() {
    return this.axios.get(`/open_api/${serviceParams.project_key}/business/all`);
  }

  // 获取字段信息
  async getFieldAll(data) {
    return this.axios.post(`/open_api/${serviceParams.project_key}/field/all`, data);
  }

  // 获取空间下的团队
  async getTeamsAll() {
    return this.axios.get(`/open_api/${serviceParams.project_key}/teams/all`);
  }

  // 特殊节点集成测试通过流转接口无法流转，故使用这个
  setWorkItemFormWeb(work_item_id) {
    return this.axios.get(`/open_api/${serviceParams.project_key}/work_item/${work_item_id}/meta`);
  }

  /**
   * 添加附件
   */
  async uploadFile(work_item_type_key, id, field_key, download_url, title) {
    try {
      this.axios({
        method: 'get',
        // url: 'https://power-browser.oss-cn-shenzhen.aliyuncs.com/avatars/UnFfqGki4TUsRdGBNpnKrkRsdM3zhvgfGZKM5nfN.png',
        url: download_url,
        responseType: 'stream'
      }).then(async res => {
        const formData = new FormData()
        formData.append('file', res, title);
        formData.append('field_key', field_key);
        this.axios({
          url: `https://project.feishu.cn/open_api/${serviceParams.project_key}/work_item/${work_item_type_key}/${id}/file/upload`,
          method: 'post',
          data: formData
        }).then(res => {
          console.log("上传成功 ===>" + title, res)
        });
      })
    } catch (err) {
      console.warn(err)
    }
  }

  /**
 * 上传附件到空间
 */
  async uploadFileInSpace(download_url) {
    const axiosGitLab = Axios.create({
      baseURL: serviceParams.base_url,
      headers: {
        Cookie: 'sidebar_collapsed=false; visitor_id=bfe73a11-154c-431a-95cb-8b0f6926fd97; remember_user_token=eyJfcmFpbHMiOnsibWVzc2FnZSI6IlcxczBNelJkTENJa01tRWtNVEFrTURaUlF6RkNWbkJFU1RKb1UxZHNheTlSZVcxM0xpSXNJakUzTVRneU5EUTROakF1TWpRME1qWTVJbDA9IiwiZXhwIjoiMjAyNC0wNi0yN1QwMjoxNDoyMC4yNDRaIiwicHVyIjoiY29va2llLnJlbWVtYmVyX3VzZXJfdG9rZW4ifX0%3D--2a4d99bd0e64d5dc745d7ec8b81855b9fbe608a0; _gitlab_session=3229aaf44f33ce0fd83debd447d8a263'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    axiosGitLab.interceptors.response.use(res => {
      return res.data;
    });

    try {
      const res = await axiosGitLab({
        method: 'get',
        // url: 'https://power-browser.oss-cn-shenzhen.aliyuncs.com/avatars/UnFfqGki4TUsRdGBNpnKrkRsdM3zhvgfGZKM5nfN.png',
        url: download_url,
        responseType: 'stream',
      });
      const formData = new FormData()
      formData.append('file', res);
      const uploadRes = await this.axios({
        url: `https://project.feishu.cn/open_api/${serviceParams.project_key}/file/upload`,
        method: 'post',
        data: formData
      });
      console.log("上传成功 ===>", uploadRes)
      return (uploadRes);
    } catch (err) {
      console.warn(err);
      return ({ image: [''] });
    }
  }

  /**
* 上传附件到工作项
*/
  async uploadFileInWork(work_item_type_key, id, field_key, download_url, title) {
    const axiosGitLab = Axios.create({
      baseURL: serviceParams.base_url,
      headers: {
        Cookie: 'sidebar_collapsed=false; visitor_id=bfe73a11-154c-431a-95cb-8b0f6926fd97; remember_user_token=eyJfcmFpbHMiOnsibWVzc2FnZSI6IlcxczBNelJkTENJa01tRWtNVEFrTURaUlF6RkNWbkJFU1RKb1UxZHNheTlSZVcxM0xpSXNJakUzTVRneU5EUTROakF1TWpRME1qWTVJbDA9IiwiZXhwIjoiMjAyNC0wNi0yN1QwMjoxNDoyMC4yNDRaIiwicHVyIjoiY29va2llLnJlbWVtYmVyX3VzZXJfdG9rZW4ifX0%3D--2a4d99bd0e64d5dc745d7ec8b81855b9fbe608a0; _gitlab_session=3229aaf44f33ce0fd83debd447d8a263'
      }
    });

    axiosGitLab.interceptors.response.use(res => {
      return res.data;
    });

    try {
      const res = await axiosGitLab({
        method: 'get',
        // url: 'https://power-browser.oss-cn-shenzhen.aliyuncs.com/avatars/UnFfqGki4TUsRdGBNpnKrkRsdM3zhvgfGZKM5nfN.png',
        url: download_url,
        responseType: 'stream',
      });
      const formData = new FormData()
      formData.append('file', res, title);
      formData.append('field_key', field_key);
      const uploadRes = await this.axios({
        url: `https://project.feishu.cn/open_api/${serviceParams.project_key}/work_item/${work_item_type_key}/${id}/file/upload`,
        method: 'post',
        data: formData
      });
      console.log("上传成功 ===>", uploadRes)
      return (uploadRes);
    } catch (err) {
      console.warn(err)
    }
  }
}

module.exports = LarkProjectService;
