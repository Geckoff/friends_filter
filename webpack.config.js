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
            }
        ]
    }
};