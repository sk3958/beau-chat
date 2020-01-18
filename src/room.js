const redis = require('redis')
const User = require('./user')

class Room {
  static roomList = {}
  static roomCount = 0
	static HKEY = 'classroom:rooms'
  static redisClient = redis.createClient(process.env.REDIS_PORT || 6379)

  constructor (roomName, roomDesc, maxUser, roomId = undefined) {
		if (undefined === roomId) this.roomId = 'room_' + ++Room.roomCount
		else this.roomId = roomId
    this.roomName = roomName
    this.roomDesc = roomDesc
    this.users = {}
		this.maxUser = maxUser

    Room.roomList[this.roomId] = this
		this.saveToRedis(true)
  }

	get userCount () {
		return Object.keys(this.users).length
	}

  addUser (user) {
    this.users[user.userId] = user
		user.roomId = this.roomId
		this.saveToRedis(false)
  }

  deleteUser (user) {
    if (this.users.hasOwnProperty(user.userId)) {
			this.users[user.userId].roomId = ''
      delete this.users[user.userId]
    }
    if (0 === this.userCount) this.destroy()
		else this.saveToRedis(false)
  }

  get info () {
    var obj = {}
    obj.roomId = this.roomId
    obj.roomName = this.roomName
    obj.roomDesc = this.roomDesc
    obj.userCount = this.userCount
		obj.maxUser = this.maxUser
    obj.users = {}
    for (var userId in this.users) {
      obj.users[userId] = this.users[userId].info
    }
    return obj
  }

  destroy () {
    delete Room.roomList[this.roomId]
    Room.roomCount--
		this.deleteFromRedis(true)
  }

	async saveToRedis (needSaveRoomCount) {
		try {
			await Room.redisClient.hset(Room.HKEY, this.roomId, JSON.stringify(this.info))
			if (needSaveRoomCount)
				await Room.redisClient.hset(Room.HKEY, 'roomCount', Room.roomCount)
		} catch(err) {
			console.log(err)
		}
	}

	async deleteFromRedis () {
		try {
			await Room.redisClient.hdel(Room.HKEY, this.roomId)
		} catch(err) {
			console.log(err)
		}
	}

  static getRoom (roomId) {
    return Room.roomList[roomId]
  }

  static getRoomByUserId (userId) {
    for (var roomId in Room.roomList) {
      if (Room.roomList[roomId].users.hasOwnProperty(userId)) return Room.roomList[roomId]
    }
    return null
  }

  static getRoomByUser (user) {
    return this.getRoomByUserId(user.userId)
  }

  static getRoomsInfo () {
    var obj = {}
    for (var roomId in Room.roomList) obj[roomId] = Room.roomList[roomId].info
    return obj
  }

  static isRoom (room) {
    if (undefined === room || null === room) return false
    return (room.hasOwnProperty('roomId') &&
      room.hasOwnProperty('roomName') &&
      room.hasOwnProperty('roomDesc') &&
      room.hasOwnProperty('users') &&
      room.hasOwnProperty('maxUser'))
  }

	static loadFromRedis () {
		try {
			Room.redisClient.hkey(Room.HKEY, (err, rtns) => {
				rtns.forEach((rtn) => {
					Room.createRoom(rtn)
				})
			})
		} catch(err) {
			console.log(err)
		}
	}

	static async createRoom (field) {
		try {
			let value = await Room.redisClient.hget(Room.HKEY, field)
			if ('roomCount' === field) {
				Room.roomCount = Number(value)
				return true
			}

			let obj = JSON.parse(value)
			let room = new Room(obj.roomName, obj.roomDesc, obj.maxUser, obj.roomId)
			
			let user
			let o
			Object.keys(obj.users).forEach((key) => {
				o = obj.users[key]
				user = new User(o.userId, o.userName, o.userType, '')
				room.addUser(user)
			})

			return room
		} catch(err) {
			console.log(err)
		}
	}
}

module.exports = Room
