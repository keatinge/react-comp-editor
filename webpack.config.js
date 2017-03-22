var webpack = require("webpack");

module.exports = {
    entry: "./main.js",

    output: {
        path:'/',
        filename: 'index.js',
    },

    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',

                query: {
                    presets: ['es2015', 'react']
                }
            }
        ]
    }

    // plugins: [
    //     new webpack.DefinePlugin({
    //         'process.env': {
    //             NODE_ENV: JSON.stringify('production')
    //         }
    //     }),
    //     new webpack.optimize.UglifyJsPlugin({minimize : true}),
    //     new webpack.optimize.DedupePlugin(),
    //     new webpack.optimize.AggressiveMergingPlugin()
    // ]
};