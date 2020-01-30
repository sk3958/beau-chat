const RedisUtil = require('./redisUtil')

class User {
  static userList = {}

  constructor (userId, userName, userType, socketId, addToList = true) {
    this.userId = userId
    this.userName = userName
    this.userType = userType
    this.socketId = socketId
    this._roomId = '' 

		if (addToList) {
			User.userList[this.userId] = this
		}
  }

  destroy () {
    delete User.userList[this.userId]
  }
	
	get roomId () {
		return this._roomId
	}

	set roomId (value) {
		this._roomId = value
		this.saveRoomIdToRedis()
	}

  get info () {
    return {
      userId: this.userId,
      userName: this.userName,
      userType: this.userType,
      roomId: this.roomId
    }
  }

	async registerReenterRoom (data) {
		if (!this.roomId) return
		let info = this.info
		info.room = data
		let key = RedisUtil.Keys.reenterRoom.prefix + this.userId
		let ttl = RedisUtil.Keys.reenterRoom.ttl
		try {
			await RedisUtil.setex(key, ttl, JSON.stringify(info))
		} catch(err) {
			console.log(err)
		}
	}

	async saveRoomIdToRedis () {
		try {
			let key = RedisUtil.Keys.user.prefix + this.userId
			await RedisUtil.hset(key, 'roomId', this.roomId)
		} catch(err) {
			console.log(err)
		}
	}

  static getUser (userId) {
    return User.userList[userId]
  }

  static getUserBySocketId (socketId) {
    for (var userId in User.userList) {
      if (User.userList[userId].socketId === socketId) return User.userList[userId]
    }
  }

  static getUsersInfo () {
    var obj = {}
    for (var userId in User.userList) obj[userId] = User.userList[userId].info
    return obj
  }

  static isUser (user) {
		return user instanceof User
  }

	static getInfoForReenterRoom (userId) {
		return new Promise((resolve, reject) => {
			let key = RedisUtil.Keys.reenterRoom.prefix + userId
			RedisUtil.get(key)
				.then((rtn) => {
					if (null === rtn) return resolve(rtn)

					let user = JSON.parse(rtn)
					if (user.userId && user.userId === userId)resolve(user)
					else reject(rtn)
				})
				.catch((err) => {
					console.log(err)
					reject(err)
				})
		})
	}

	static async deleteReenterRoom (userId) {
		let key = RedisUtil.Keys.reenterRoom.prefix + userId
		try {
			await RedisUtil.del(key)
		} catch(e) {
			console.log(e)
		}
	}

	static existsSession (userId) {
		let key = RedisUtil.Keys.user.prefix + userId
		return RedisUtil.exists(key)
	}

	static extendSessionTime (userId) {
		let key = RedisUtil.Keys.user.prefix + this.userId
		let ttl = RedisUtil.Keys.user.ttl
		return RedisUtil.expire(key, ttl)
	}
}

module.exports = User
