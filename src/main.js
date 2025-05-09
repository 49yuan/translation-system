import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import axios from './api/axios'; 
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import './assets/css/global.css';
import { createPinia } from 'pinia'

const app = createApp(App);
const pinia = createPinia();

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}
// 配置请求的根路径
axios.defaults.baseURL = window.g.base_url;
console.log(window.g.base_url)
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
