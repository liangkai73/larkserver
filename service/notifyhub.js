const Axios = require('axios');
const config = require('../config/webhooks');

class NotifyHubService {
  constructor() {
    const axios = Axios.create({
      baseURL: config.notifyHubApi,
    });

    axios.interceptors.response.use(res => {
      return res.data;
    });

    this.axios = axios;
  }

  /**
   * 获取频道列表
   */
  async getChannelList() {
    return this.axios.get('notify/channel');
  }

  /**
   * 创建通知频道
   */
  async createChannel(data) {
    return this.axios.post('notify/channel', data);
  }

  /**
   * 发送通知
   */
  async sendNotify(id, data, source = '') {
    return this.axios.post(`notify/push/${id}?source=${source}`, data);
  }
}

module.exports = NotifyHubService;