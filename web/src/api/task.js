import request from './request';

export const taskApi = {
  getStatus(contentId) {
    return request.get(`/tasks/${contentId}/status`);
  },
  retry(contentId) {
    return request.post(`/tasks/${contentId}/retry`);
  },
  // SSE 监听方法：返回一个 EventSource 对象
  streamStatus(contentId, onMessage) {
    const token = localStorage.getItem('token');
    // EventSource 不能设 header，token 放 URL 参数里
    const evtSource = new EventSource(`/api/tasks/${contentId}/stream?token=${token}`);

    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);

      // 完成或失败就关闭连接
      if (data.status === 'completed' || data.status === 'failed' || data.status === 'no_task') {
        evtSource.close();
      }
    };

    evtSource.onerror = () => {
      evtSource.close();
    };

    return evtSource;  // 返回 EventSource，方便外部关闭
  },
};