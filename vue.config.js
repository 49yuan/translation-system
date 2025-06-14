const { defineConfig } = require('@vue/cli-service');
const { default: videojs } = require('video.js');

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/minnan/' : '/',
  devServer: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    },
    allowedHosts: 'all',
  },
});