const redis = require('redis')

class redisUtil {
  static client = redis.createClient(process.env.REDIS_PORT || 6379)

	static get (key) {
		return new Promise((resolve, reject) => {
			redisUtil.client.get(key, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static set (key, value) {
		return new Promise((resolve, reject) => {
			redisUtil.client.set(key, value, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static setex (key, timeout, value) {
		return new Promise((resolve, reject) => {
			redisUtil.client.setex(key, timeout, value, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static del (key) {
		return new Promise((resolve, reject) => {
			redisUtil.client.del(key, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static hget (key, field) {
		return new Promise((resolve, reject) => {
			redisUtil.client.hget(key, field, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static hgetall (key) {
		return new Promise((resolve, reject) => {
			redisUtil.client.hgetall(key, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static hset (key, field, value) {
		return new Promise((resolve, reject) => {
			redisUtil.client.hset(key, field, value, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static hdel (key, field) {
		return new Promise((resolve, reject) => {
			redisUtil.client.hdel(key, field, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}
}

module.exports = redisUtil
