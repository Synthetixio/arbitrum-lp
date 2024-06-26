const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CopyWebpackPlugin = require('copy-webpack-plugin');
require('dotenv').config();

// For depcheck to be happy
require.resolve('webpack-dev-server');

const htmlPlugin = new HtmlWebpackPlugin({
  template: './index.html',
  scriptLoading: 'defer',
  minify: false,
  hash: false,
  xhtml: true,
  excludeChunks: ['main'],
});

const babelRule = {
  test: /\.(ts|tsx|js|jsx)$/,
  include: [
    // Need to list all the folders in v3 and outside (if used)
    /contracts/,

    /liquidity\/lib/,
    /liquidity\/ui/,

    // fixes for borked 3rd party bundles
    /@safe-global/,
    /@web3-onboard/,
  ],
  resolve: {
    fullySpecified: false,
  },
  use: {
    loader: require.resolve('babel-loader'),
    options: {
      configFile: path.resolve(__dirname, 'babel.config.js'),
    },
  },
};

const imgRule = {
  test: /\.(png|jpg|ico|gif|woff|woff2|ttf|eot|doc|pdf|zip|wav|avi|txt|webp|svg)$/,
  type: 'asset',
  parser: {
    dataUrlCondition: {
      maxSize: 4 * 1024, // 4kb
    },
  },
};

const cssRule = {
  test: /\.css$/,
  include: [new RegExp('./src'), new RegExp('@rainbow-me/rainbowkit')],
  exclude: [],
  use: [
    {
      loader: require.resolve('style-loader'),
    },
    {
      loader: require.resolve('css-loader'),
    },
  ],
};

const devServer = {
  port: '3000',

  hot: true,
  liveReload: false,

  historyApiFallback: true,

  devMiddleware: {
    writeToDisk: false,
    publicPath: '',
  },

  client: {
    logging: 'log',
    overlay: false,
    progress: false,
  },

  static: './public',

  headers: { 'Access-Control-Allow-Origin': '*' },
  allowedHosts: 'all',
  open: false,
  compress: false,
};

module.exports = {
  devtool: 'source-map',
  devServer,
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './index.js',

  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '',
    filename: '[name].js',
    chunkFilename:
      process.env.NODE_ENV === 'production' ? 'chunk/[name].[contenthash:8].js' : '[name].js',
    assetModuleFilename: '[name].[contenthash:8][ext]',
    clean: true,
  },

  optimization: {
    runtimeChunk: false,
    splitChunks: {
      chunks: 'async',
      maxAsyncRequests: 10,
      maxInitialRequests: 10,
      hidePathInfo: true,
      automaticNameDelimiter: '--',
      name: false,
    },
    moduleIds: process.env.NODE_ENV === 'production' ? 'deterministic' : 'named',
    chunkIds: process.env.NODE_ENV === 'production' ? 'deterministic' : 'named',
    minimize: process.env.NODE_ENV === 'production',
    minimizer: [new TerserPlugin()],
    innerGraph: true,
    emitOnErrors: false,
  },

  plugins: [htmlPlugin]
    .concat(
      process.env.NODE_ENV === 'production'
        ? [new CopyWebpackPlugin({ patterns: [{ from: 'public', to: '' }] })]
        : []
    )

    .concat([
      new webpack.NormalModuleReplacementPlugin(
        /^@tanstack\/react-query$/,
        require.resolve('@tanstack/react-query')
      ),
      new webpack.NormalModuleReplacementPlugin(/^bn.js$/, require.resolve('bn.js')),
    ])

    .concat([
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser.js',
      }),
    ])
    .concat(
      new webpack.DefinePlugin({
        'process.env.INFURA_KEY': JSON.stringify(process.env.INFURA_KEY),
        'process.env.WC_PROJECT_ID': JSON.stringify(process.env.WC_PROJECT_ID),
        'process.env.PYTH_MAINNET_ENDPOINT': JSON.stringify(process.env.PYTH_MAINNET_ENDPOINT),
        'process.env.PYTH_TESTNET_ENDPOINT': JSON.stringify(process.env.PYTH_TESTNET_ENDPOINT),
      })
    )
    .concat(
      process.env.NODE_ENV === 'production'
        ? []
        : [new ReactRefreshWebpackPlugin({ overlay: false })]
    )
    .concat(
      process.env.GENERATE_BUNDLE_REPORT === 'true'
        ? [
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              reportFilename: path.resolve(__dirname, 'tmp', 'webpack.html'),
              openAnalyzer: false,
              generateStatsFile: false,
            }),
          ]
        : []
    ),

  resolve: {
    fallback: {
      buffer: require.resolve('buffer'),
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
      process: require.resolve('process/browser.js'),
      vm: require.resolve('vm-browserify'),
      http: false,
      https: false,
      os: false,
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
  },

  module: {
    rules: [babelRule, imgRule, cssRule],
  },
};
