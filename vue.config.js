const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  publicPath: "/synthesis/",
  transpileDependencies: true,
  devServer: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    },
    allowedHosts: 'all',
  }
});