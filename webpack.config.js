module.exports = {
    entry: './src/js/script.js',
    output: {
        filename: './src/js/bundle.js'
    },
    watch: true,
    module: {
        rules: [
            { 
                test: /\.handlebars$/, 
                loader: "handlebars-loader" 
            },
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    // options: {
                    //     presets: ['es2015']
                    // }
                }
            }
        ]
    }
};