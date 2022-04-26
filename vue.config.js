const path = require('path')
const resolve = dir => path.join(__dirname, '.', dir);
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  // !!!!!! 非常重要，否则打包后无法访问 !!!!!!
  publicPath: './',
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin({
          patterns: [
            { from: path.join(__dirname, 'utools'), to: path.join(__dirname, 'dist') }
          ],
        })
    ]
  },
  chainWebpack: config => {
    config.module.rules.delete("svg") // 重点：删除默认配置中处理 svg
    config.module.rule('svg-sprite-loader').test(/\.svg$/)
          .include.add(path.resolve('./src/assets/svg')) // 处理svg保存路径
          .end()
          .use('svg-sprite-loader')
          .loader('svg-sprite-loader')
          .options({
            //   symbolId: 'icon-[name]' // 给symbo配置id
          })
    },
}