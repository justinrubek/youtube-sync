const environment = {
    development: {
        isProduction: false
    },
    production: {
        isProduction: true
    }
}[ process.NODE_ENV || "development"]

export default Object.assign({
    host: 'localhost',
    port: 3000,
	  logging_format: "debug",
    default_video_id: "c8W-auqg024",
    redis_host: "127.0.0.1",
    redis_port: 6379,
    redis_options: {}
}, environment);
