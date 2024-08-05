const Axios = require('axios');
const config = require('../config/webhooks');

class LarkService {
  token;
  constructor(token) {
    this.token = token;
    const axios = Axios.create({
      baseURL: config.larkApi,
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    axios.interceptors.response.use(res => {
      if (res.data.code !== 0) {
        return Promise.reject(res.data);
      }
      return res.data;
    });

    this.axios = axios;
  }

  static async refreshAccessToken({id, secret}) {
    try {
      const res = await Axios.post(`${config.larkApi}auth/v3/app_access_token/internal`, {
        app_id: id,
        app_secret: secret,
      });
      if (res.data.app_access_token) return res.data.app_access_token;
      return null;
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * 获取云空间根目录
   */
  getRootFolder() {
    return this.axios.get('drive/explorer/v2/root_folder/meta');
  }

  /**
   * 获取文件夹下文件清单
   * token 文件夹token
   * types 需要查询的文件类型，默认返回所有 children；types 可多选，可选类型有 doc、sheet、file、bitable、docx、folder、mindnote 。如 url?types=folder&types=sheet
   */
  getFolderChildren({token, types = ''}) {
    return this.axios.get(`drive/explorer/v2/folder/${token}/children?${types}`);
  }

  /**
   * 创建文件夹
   * token 父文件夹token
   * name 文件夹名称
   */
  createFolder({name, token}) {
    return this.axios.post('drive/v1/files/create_folder', {
      name,
      folder_token: token,
    })
  }

  /**
   * 创建文档
   * token 父文件夹token
   * name 文件名称
   * type 需要创建文档的类型 "doc" 、 "sheet" or "bitable"
   */
  createFile({ name, token, type }) {
    return this.axios.post(`drive/explorer/v2/file/${token}`, {
      title: name,
      type,
    })
  }

  /**
   * 修改权限
   * https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/permission-public/patch
   */
  updatePermission({ token, type = '', data }) {
    return this.axios.patch(`drive/v1/permissions/${token}/public?${type}`, data);
  }

  /**
   * 转移文档拥有者
   */
  updateOwner(data) {
    return this.axios.post('drive/permission/member/transfer', data);
  }

  /**
   * 增加协作者权限
   */
  updateMemberPermission({token, type = '', notification = true, data}) {
    return this.axios.post(`drive/v1/permissions/${token}/members?type=${type}&need_notification=${notification}`, data);
  }


  /**
   * 删除文件
   */
  deleteFile({ token, type = '' }) {
    return this.axios.delete(`drive/v1/files/${token}?type=${type}`,)
  }

  /**
   * 获取文档元数据
   * https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/drive-v1/meta/batch_query
   */
  getFileMeta(data) {
    return this.axios.post('drive/v1/metas/batch_query', data);
  }

  /**
   * 获取用户列表
   */
  getUsers(data) {
    return this.axios.get('contact/v3/users/find_by_department', {
      params: {
        page_size: 50,
        ...data
      },
    });
  }

  /**
   * 获取多维表格数据表列表
   */
  getBitableTables({ token, data }) {
    return this.axios.get(`bitable/v1/apps/${token}/tables`, {
      params: {
        page_size: 100,
        ...data,
      }
    })
  }

  /**
   * 新增多维表格数据表
   */
  createBitableTable({ token, name }) {
    return this.axios.post(`bitable/v1/apps/${token}/tables`, {
      table: {
        name,
      }
    })
  }

  deleteBitableTable({ token, tableID }) {
    return this.axios.delete(`bitable/v1/apps/${token}/tables/${tableID}`, )
  }


  /**
   * 获取多维表格数据库字段
   */
  getBitableFields({ token, id, data }) {
    return this.axios.get(`bitable/v1/apps/${token}/tables/${id}/fields`, {
      params: {
        page_size: 100,
        ...data,
      }
    })
  }

  /**
   * 新增多维表格数据表字段
   */
  createBitableTableFields({ token, id, name , type, property }) {
    return this.axios.post(`bitable/v1/apps/${token}/tables/${id}/fields`, {
      field_name: name,
      type,
      property,
    })
  }

  /**
   * 修改多维表格数据表字段
   */
  updateBitableTableFields({ token, tid, id, name , type, property }) {
    return this.axios.put(`bitable/v1/apps/${token}/tables/${tid}/fields/${id}`, {
      field_name: name,
      type,
      property,
    })
  }

  /**
   * 列出多维表格记录
   */
  getBitableRecords({ token, id, data }) {
    return this.axios.get(`bitable/v1/apps/${token}/tables/${id}/records`, {
      params: data
    });
  }

  /**
   * 创建多维表格记录
   */
  createBitableRecord({ token, id, data }) {
    return this.axios.post(`bitable/v1/apps/${token}/tables/${id}/records`, data);
  }

  /**
   * 删除多维表格记录
   */
  deleteBitableRecord({ token, id ,recordId}) {
    return this.axios.delete(`bitable/v1/apps/${token}/tables/${id}/records/${recordId}`);
  }

  /**
   * 更新多维表格记录
   */
  updateBitableRecord({ token, tid, id, data }) {
    return this.axios.put(`bitable/v1/apps/${token}/tables/${tid}/records/${id}`, data);
  }

  /**
   * 批量创建多条多维表格记录
   */
  batchCreateBitableRecord({ token, id, data }) {
    return this.axios.post(`bitable/v1/apps/${token}/tables/${id}/records/batch_create`, data);
  }

  /**
   * 批量更新多维表格记录
   */
  batchUpdateBitableRecord({ token, tid, data }) {
    return this.axios.post(`bitable/v1/apps/${token}/tables/${tid}/records/batch_update`, data);
  }

  /**
   * 查询用户
   */
  getQueryUser(data) {
    return this.axios.get('search/v1/user', {
      params: {
        page_size: 200,
        ...data
      }
    });
  }

  /**
   * 查询部门
   */
  getQueryDepartments(data) {
    return this.axios.post('contact/v3/departments/search', {
      ...data
    })
  }

  /**
   * 通过邮箱获取用户
   */
   getUserByEmailAndMobile({ email, mobile }) {
    return this.axios.post(`contact/v3/users/batch_get_id`, {
      emails: email ? [email] : [],
      mobiles: mobile ? [mobile] : []
    })
  }

  /**
   * 通过审批实例获取实例详情
   * @param {*} instanceCode
   * @returns
   */
  getInstancesDetail(instanceCode){
    return this.axios.get(`approval/v4/instances/${instanceCode}`);
  }

  /**
   * 获取电子工作表
   */
  getSheetQuery(spreadsheetToken){
    return this.axios.get(`sheets/v3/spreadsheets/${spreadsheetToken}/sheets/query`);
  }

  /**
   * 查询电子工作表
   */
  getSheet(spreadsheetToken,sheet_id){
    return this.axios.get(`sheets/v3/spreadsheets/${spreadsheetToken}/sheets/${sheet_id}`);
  }

  /**
   * sheet表格读取单个范围
   */
  getSheetRange(spreadsheetToken,range,params){
    return this.axios.get(`sheets/v2/spreadsheets/${spreadsheetToken}/values/${range}`,{
      params
    });
  }

  /**
   * sheet向单个范围写入数据
   */
  updateSheetRangeValue(spreadsheetToken,data){
    return this.axios.put(`sheets/v2/spreadsheets/${spreadsheetToken}/values`,data);
  }

  /**
   * sheet表插入行列
   */
  insertSheetRange(spreadsheetToken,data){
    return this.axios.post(`sheets/v2/spreadsheets/${spreadsheetToken}/insert_dimension_range`,data);
  }

  /**
   * sheet表增加行列
   */
  addSheetRange(spreadsheetToken,data){
    return this.axios.post(`sheets/v2/spreadsheets/${spreadsheetToken}/dimension_range`,data);
  }

  /**
   * sheet表移动行列
   */
  moveSheetRange(spreadsheetToken,sheet_id,data){
    return this.axios.post(`sheets/v3/spreadsheets/${spreadsheetToken}/sheets/${sheet_id}/move_dimension`,data);
  }
}

module.exports = LarkService;
