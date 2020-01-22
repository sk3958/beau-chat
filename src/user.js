const redisUtil = require('./redisUtil')

class User {
  static userList = {}
	static snapshot = {}
	static HKEY = 'classroom:users'
	static HREENTER = 'classroom:needReenter:'
	static HRECONNECT = 'classroom:needReconnect:'
	static REENTER_EXPIRE = 20
	static RECONNECT_EXPIRE = 20

  constructor (userId, userName, userType, socketId, addToList = true) {
    this.userId = userId
    this.userName = userName
    this.userType = userType
    this.socketId = socketId
    this._roomId = '' 
    this._sessionId = '' 

		if (addToList) {
			User.userList[this.userId] = this
			this.saveToRedis()
		}
  }

  destroy () {
    delete User.userList[this.userId]
		this.deleteFromRedis()
		this.registerForReconnect()
  }
	
	get roomId () {
		return this._roomId
	}

	set roomId (value) {
		this._roomId = value
		this.saveToRedis()
	}

	get sessionId () {
		return this._sessionId
	}

	set sessionId (value) {
		this._sessionId = value
		this.saveToRedis()
	}

  get info () {
    return {
      userId: this.userId,
      userName: this.userName,
      userType: this.userType,
      roomId: this.roomId
    }
  }

	get _info () {
    return {
      userId: this.userId,
      userName: this.userName,
      userType: this.userType,
      roomId: this.roomId,
      sessionId: this.sessionId
    }
	}

	async registerReenterRoom (data) {
		if (!this.roomId) return
		let info = this.info
		info.room = data
		let key = User.HREENTER + this.userId
		try {
			await redisUtil.setex(key, User.REENTER_EXPIRE, JSON.stringify(info))
		} catch(err) {
			console.log(err)
		}
	}

	async registerForReconnect () {
		let info = this.info
		let key = User.HRECONNECT + this.userId
		try {
			await redisUtil.setex(key, User.RECONNECT_EXPIRE, JSON.stringify(info))
		} catch(err) {
			console.log(err)
		}
	}

	async saveToRedis () {
		try {
			await redisUtil.hset(User.HKEY, this.userId, JSON.stringify(this._info))
		} catch(err) {
			console.log(err)
		}
	}

	async deleteFromRedis () {
		try {
			await redisUtil.hdel(User.HKEY, this.userId)
		} catch(err) {
			console.log(err)
		}
	}

  static getUser (userId) {
    return User.userList[userId]
  }

  static getSnapshot (userId) {
    return User.snapshot[userId]
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

	static async loadFromRedis () {
		try {
			let obj = await redisUtil.hgetall(User.HKEY)
			if (null === obj) return
			Object.keys(obj).forEach((key) => {
				User.createUser(obj[key])
			})
		} catch(err) {
			console.log(err)
		}
	}

	static createUser (strUser) {
		try {
			let obj = JSON.parse(strUser)
			let user = new User(obj.userId, obj.userName, obj.userType, '', false)
			user.sessionId = obj.sessionId
			User.snapshot[user.userId] = user
			return user
		} catch(err) {
			console.log(err)
		}
	}

	static getInfoForReconnect (userId) {
		return new Promise((resolve, reject) => {
			let key = User.HRECONNECT + userId
			redisUtil.get(key)
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

	static getInfoForReenterRoom (userId) {
		return new Promise((resolve, reject) => {
			let key = User.HREENTER + userId
			redisUtil.get(key)
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

	static getUserSession (sessionId) {
		return redisUtil.get(sessionId)
	}

	static async deleteReenterRoom (userId) {
		let key = User.HREENTER + userId
		try {
			await redisUtil.del(key)
		} catch(e) {
			console.log(e)
		}
	}
}

module.exports = User
