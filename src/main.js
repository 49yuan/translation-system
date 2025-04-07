import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import axios from 'axios';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import './assets/css/global.css';
import { createPinia } from 'pinia'

const app = createApp(App);
const pinia = createPinia();

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}
// 配置请求的根路径
axios.defaults.baseURL = process.env.VUE_APP_API_BASE_URL;
app.config.globalProperties.$http = axios;
// 请求拦截器
axios.interceptors.request.use(config => {
    config.headers.Authorization = window.sessionStorage.getItem('token');
    return config
});

app.use(pinia)
app.config.globalProperties.$pinia = pinia
app.use(ElementPlus);
app.use(router);
app.mount('#app');