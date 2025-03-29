# frontend/Dockerfile
FROM nginx:stable

# 安装vim
RUN apk update && apk add --no-cache vim nodejs npm

# 指定需要暴露的端口（80 和 443）
EXPOSE 80 443

# ① 拷贝前端文件到Nginx目录
COPY dist /usr/share/nginx/html

# ② 覆盖默认Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf
