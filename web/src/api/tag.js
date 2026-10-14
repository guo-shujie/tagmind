import request from './request';

export const tagApi = {
  create(data) {
    return request.post('/tags', data);
  },

  list() {
    return request.get('/tags');
  },

  tree() {
    return request.get('/tags/tree');
  },

  update(id, data) {
    return request.put(`/tags/${id}`, data);
  },

  remove(id) {
    return request.delete(`/tags/${id}`);
  },
};