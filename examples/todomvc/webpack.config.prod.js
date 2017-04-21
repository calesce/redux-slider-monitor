const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './index',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
    })
  ],
  resolve: {
    alias: {
      'redux-slider-monitor': path.join(__dirname, '..', '..', 'src/SliderMonitor'),
      react: path.join(__dirname, '../../node_modules', 'react'),
      'react-dom': path.join(__dirname, '../../node_modules', 'react-dom'),
      'redux-devtools': path.join(__dirname, '../../node_modules', 'redux-devtools')
    },
    extensions: ['.js']
  },
  module: {
    rules: [{
      test: /\.js$/,
      use: ['babel-loader'],
      exclude: /node_modules/,
      include: [
        __dirname,
        path.join(__dirname, '..', '..', 'src')
      ]
    }, {
      test: /\.css?$/,
      use: ['style-loader', 'raw-loader'],
      include: __dirname
    }]
  }
};
