import request from './request';

export const taskApi = {
  getStatus(contentId) {
    return request.get(`/tasks/${contentId}/status`);
  },
  retry(contentId) {
    return request.post(`/tasks/${contentId}/retry`);
  },
};