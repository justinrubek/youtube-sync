const webpack = require('webpack');
const PrettierPlugin = require('prettier-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const path = require("path");

const config = {
  entry: ['babel-polyfill', __dirname + '/src/index.jsx'],
  cache: false,
  devtool: 'cheap-module-source-map',
  output: {
    path: path.resolve("../public"),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.css']
  },
  module: {
    rules: [
      {
        test: /\.jsx?/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.css$/,
        use: [ 
          { 
            loader: 'style-loader' 
          },
          {
            loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1,
              localIdentName: '[name]_[local]_[hash:base64:5]',
              sourceMap: true,
              minimize: true
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new PrettierPlugin({
      extensions: [ '.js', '.jsx' ]
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, [/moment$/]),
   /* new CompressionPlugin({
      asset: '[path].qz[query]',
      algorithm: 'gzip',
      test: /\.js$|\.css$|\.html$/,
      threshold: 10240,
      minRatio: 0
    })*/
  ]
};

module.exports = config;
