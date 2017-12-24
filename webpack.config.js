module.exports = {
    entry: './script.js',
    output: {
        filename: './bundle.js'
    },
    watch: true,
    module: {
        rules: [
            { 
                test: /\.handlebars$/, 
                loader: "handlebars-loader" 
            },
            // {
            //     test: /\.js$/,
            //     exclude: /(node_modules|bower_components)/,
            //     use: {
            //         loader: 'babel-loader',
            //         options: {
            //             presets: ['es2015']
            //         }
            //     }
            // }
        ]
    }
};