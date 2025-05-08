import axios from 'axios'; 
import { ElMessageBox } from 'element-plus';

const instance = axios.create({
  baseURL: window.g.base_url,
  timeout: 10000,
});

// 封装递归处理函数
const handleActivation = (originalRequest, errorMessage) => {
  return ElMessageBox.prompt(
    errorMessage || '系统需要授权，请输入激活码继续使用',
    '授权验证',
    {
      inputPlaceholder: '请输入16位激活码',
      inputPattern: /./,
      inputErrorMessage: '激活码格式错误',
      confirmButtonText: '立即验证',
      cancelButtonText: '取消',
      customClass: 'error-message-box'  // 设置自定义类
    }
  )
  .then(({ value }) => {
    return instance.get('/auth/activate', { 
      params: { 
        license: value,
      } 
    })
    .then(res => {
      if (res.data?.data?.result) {
        ElMessageBox.close(); // 关闭成功提示避免堆叠
        return instance(originalRequest); // 重试原始请求
      }
      return handleActivation(originalRequest, res.data?.data?.msg || '激活码无效，请重新输入');
    })
    .catch(error => {
      return handleActivation(originalRequest, `验证失败（${error.code}），请重试`);
    });
  })
  .catch(() => {
    return Promise.reject(new Error('USER_CANCELLED'));
  });
};

instance.interceptors.response.use(
  response => {
    if ([401, 402, 403].includes(response.data?.code) && 
        !response.config.url.includes('/auth/activate')) {
      return handleActivation(response.config);
    }
    return response;
  },
  error => {
    const status = error.response?.status;
    if ([401, 402, 403].includes(status)) {
      return handleActivation(error.config);
    }
    return Promise.reject(error);
  }
);

// 添加请求拦截器记录请求时间
instance.interceptors.request.use(config => {
  config.metadata = { startTime: Date.now() }
  return config;
});

instance.interceptors.response.use(response => {
  console.log(`请求耗时：${Date.now() - response.config.metadata.startTime}ms`);
  return response;
});

export default instance;

