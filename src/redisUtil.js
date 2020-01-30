const redis = require('redis')

class RedisUtil {
	static Keys = {
		user: {
			prefix: 'classroom:user:',
			ttl: 3600
		},
		login: {
			prefix: 'classroom:login:',
			ttl: 30
		},
		reenterRoom: {
			prefix: 'classroom:needReenterRoom:',
			ttl: 20
		}
	}

  static client = redis.createClient(process.env.REDIS_PORT || 6379)

	static get (key) {
		return new Promise((resolve, reject) => {
			RedisUtil.client.get(key, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static set (key, value) {
		return new Promise((resolve, reject) => {
			RedisUtil.client.set(key, value, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static setex (key, timeout, value) {
		return new Promise((resolve, reject) => {
			RedisUtil.client.setex(key, timeout, value, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static del (key) {
		return new Promise((resolve, reject) => {
			RedisUtil.client.del(key, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static hget (key, field) {
		return new Promise((resolve, reject) => {
			RedisUtil.client.hget(key, field, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static hgetall (key) {
		return new Promise((resolve, reject) => {
			RedisUtil.client.hgetall(key, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static hset (key, field, value) {
		return new Promise((resolve, reject) => {
			RedisUtil.client.hset(key, field, value, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static hdel (key, field) {
		return new Promise((resolve, reject) => {
			RedisUtil.client.hdel(key, field, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static exists (key) {
		return new Promise((resolve, reject) => {
			RedisUtil.client.exists(key, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}

	static expire (key, ttl) {
		return new Promise((resolve, reject) => {
			RedisUtil.client.expire(key, ttl, (err, rtn) => {
				if (err) return reject(err)
				resolve(rtn)
			})
		})
	}
}

module.exports = RedisUtil
