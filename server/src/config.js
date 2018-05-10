const environment = {
    development: {
        isProduction: false
    },
    production: {
        isPRoduction: true
    }
}[ process.NODE_ENV || "development"]

export default Object.assign({
    host: 'localhost',
    port: 3000
}, environment);
