import path from 'path';
import webpack from 'webpack';
import Dotenv from 'dotenv-webpack';
import InterpolateHtmlPlugin from '@storybook/react-dev-utils/InterpolateHtmlPlugin';
import WatchMissingNodeModulesPlugin from '@storybook/react-dev-utils/WatchMissingNodeModulesPlugin';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import {
  managerPath,
  getPreviewHeadHtml,
  getManagerHeadHtml,
  indexHtmlPath,
  iframeHtmlPath,
} from '@storybook/core/server';

import { includePaths, excludePaths, nodeModulesPaths, loadEnv, nodePaths } from './utils';
import babelLoaderConfig from './babel';
import { version } from '../../../package.json';

export default function(configDir, quiet) {
  const config = {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    entry: {
      manager: [require.resolve('./polyfills'), managerPath],
      preview: [
        require.resolve('./polyfills'),
        require.resolve('./globals'),
        `${require.resolve('webpack-hot-middleware/client')}?reload=true`,
      ],
    },
    output: {
      path: path.join(__dirname, 'dist'),
      filename: 'static/[name].bundle.js',
      publicPath: '/',
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        chunks: ['manager'],
        chunksSortMode: 'none',
        data: {
          managerHead: getManagerHeadHtml(configDir),
          version,
        },
        template: indexHtmlPath,
      }),
      new HtmlWebpackPlugin({
        filename: 'iframe.html',
        excludeChunks: ['manager'],
        chunksSortMode: 'none',
        data: {
          previewHead: getPreviewHeadHtml(configDir),
        },
        template: iframeHtmlPath,
      }),
      new InterpolateHtmlPlugin(process.env),
      new webpack.DefinePlugin(loadEnv()),
      new webpack.HotModuleReplacementPlugin(),
      new CaseSensitivePathsPlugin(),
      new WatchMissingNodeModulesPlugin(nodeModulesPaths),
      new webpack.ProgressPlugin(),
      quiet ? null : new webpack.ProgressPlugin(),
      new webpack.ContextReplacementPlugin(
        /angular(\\|\/)core(\\|\/)(@angular|esm5)/,
        path.resolve(__dirname, '../src')
      ),
      new Dotenv({ silent: true }),
    ].filter(Boolean),
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          loader: require.resolve('babel-loader'),
          query: babelLoaderConfig,
          include: includePaths,
          exclude: excludePaths,
        },
        {
          test: /\.ts?$/,
          loaders: [
            {
              loader: require.resolve('ts-loader'),
            },
            require.resolve('angular2-template-loader'),
          ],
        },
        {
          test: /\.html$/,
          loader: 'raw-loader',
          exclude: /\.async\.html$/,
        },
        {
          test: /\.scss$/,
          loaders: [require.resolve('raw-loader'), require.resolve('sass-loader')],
        },
        {
          test: /\.md$/,
          loader: require.resolve('raw-loader'),
        },
      ],
    },
    resolve: {
      // Since we ship with json-loader always, it's better to move extensions to here
      // from the default config.
      extensions: ['.js', '.ts', '.jsx', '.tsx', 'json'],
      // Add support to NODE_PATH. With this we could avoid relative path imports.
      // Based on this CRA feature: https://github.com/facebookincubator/create-react-app/issues/253
      modules: ['node_modules'].concat(nodePaths),
    },
    performance: {
      hints: false,
    },
  };

  return config;
}
