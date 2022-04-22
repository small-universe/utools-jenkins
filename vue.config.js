const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
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