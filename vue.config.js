const path = require('path')
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
  }
}