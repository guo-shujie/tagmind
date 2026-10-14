import request from './request';

export const contentApi = {
  // 创建内容
  create(data) {
    return request.post('/contents', data);
  },

  // 获取内容列表
  list(params) {
    return request.get('/contents', { params });
  },

  // 获取详情
  detail(id) {
    return request.get(`/contents/${id}`);
  },

  // 更新
  update(id, data) {
    return request.put(`/contents/${id}`, data);
  },

  // 删除
  remove(id) {
    return request.delete(`/contents/${id}`);
  },
};