'use strict'
const path = require('path');
const webpack = require('webpack');
// const ExtractTextPlugin = require('extract-text-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const AssetsPlugin = require('assets-webpack-plugin');
const autoprefixer = require('autoprefixer');
const WebpackChunkHash = require("webpack-chunk-hash");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
var InlineEnvironmentVariablesPlugin = require('inline-environment-variables-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const isPro = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
let publicPath = '/';
let outPath = path.join(__dirname, 'server', isDev ? 'dev' : isTest ? 'test' : 'public')
let videoPath = path.join(__dirname, 'src', 'video')
let extraPlugins = [];
let chunkhashPlaceholder = '';
let contenthashPlaceholder = '';

if (isPro) {
    //publicPath = '//sealimg.youneng.com/static/math/';
    extraPlugins = [
        new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false,
        })
    ];
    //chunkhashPlaceholder = '[chunkhash:16].';
    //contenthashPlaceholder = '[contenthash:16].';
}

const uglify = new UglifyJsPlugin({
    uglifyOptions: {
        beautify: false,    // 最紧凑的输出
        comments: false,    // 删除所有的注释
        sourceMap: true,
        compress: {
            warnings: false,        // 在UglifyJs删除没有用到的代码时不输出警告
            drop_console: true,     // 删除所有的 `console` 语句，可以兼容ie浏览器
            collapse_vars: true,    // 内嵌定义了但是只用到一次的变量
            reduce_vars: true,      // 提取出出现多次但是没有定义成变量去引用的静态值
        },
    }
})

const rootAssetPath = path.resolve(__dirname, 'src');

const config = {
    context: rootAssetPath,
    resolve: {
        modules: [rootAssetPath, 'node_modules'],
        extensions: [".js", ".jsx", ".json"],
    },
    entry: {
        bundle: './js/app.jsx',
        //wx: './js/wx/entry.jsx'
    },
    output: {
        publicPath,
        path: outPath,
        filename: `[name].${chunkhashPlaceholder}js`,
        chunkFilename: `[name].${chunkhashPlaceholder}js`,
    },
    optimization: {
        minimizer: [uglify],
        // runtimeChunk: 'single',
        splitChunks: {
            chunks: 'all',
            minSize: 30000,
            minChunks: 1,
            maxAsyncRequests: 5,
            maxInitialRequests: 3,
            automaticNameDelimiter: '~',
            name: 'commons',
            cacheGroups: {
                vendors: {
                    name: 'vendors',
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true,
                },
            },
        },
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: videoPath, to: path.join(__dirname, 'server', 'video'), toType: 'dir'
            },
        ]),
        new webpack.NamedModulesPlugin(),
        new InlineEnvironmentVariablesPlugin(),
        new WebpackChunkHash(),
        // new webpack.optimize.CommonsChunkPlugin({
        //     name: 'commons',
        //     filename: `commons.${chunkhashPlaceholder}js`,
        //     minChunks: 2,
        // }),
        new CleanWebpackPlugin(outPath),
        /*new webpack.optimize.CommonsChunkPlugin({
            name: 'bootstrap',
            filename: 'webpack_bootstrap.js',
            chunks: ['commons'],
        }),*/
        // new ExtractTextPlugin(`[name].${contenthashPlaceholder}css`),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: isDev ? '[name].css' : '[name].${contenthashPlaceholder}css',
            // chunkFilename: isDev ? '[id].css' : '[id].[hash].css',
        }),
        new AssetsPlugin({
            filename: 'manifest.json',
            path: outPath,
            prettyPrint: true,
        }),
    ].concat(extraPlugins),
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true
                        }
                    }
                ]
            },
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    {
                        loader: isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: publicPath
                        }
                    },
                    {
                        loader: 'css-loader?-autoprefixer',
                    },
                    {
                        loader: 'postcss-loader', options: { plugins: [require("autoprefixer")("last 100 versions")] }
                    },
                    'resolve-url-loader',
                    'sass-loader?sourceMap',
                ],
            },
            {
                test: /\.png|\.jpg|\.gif$/,
                use: [
                    
                    "url-loader?limit=5000&name=img/[name].[hash:8].[ext]",
                    {
                        loader: 'image-webpack-loader',
                        query: {
                            optipng: { optimizationLevel: 3 },
                            pngquant: false,
                        }
                    }
                ]

            },
        ],
    },
    externals: {
        jquery: "jQuery",
        global: 'Global',
        echarts: "echarts",
        mathjax: 'MathJax',
        "raven-js": "Raven",
    },
    devtool: 'source-map',
    stats: {
        children: false,
    },
};

module.exports = config;
