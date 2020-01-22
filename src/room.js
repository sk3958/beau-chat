const redisUtil = require('./redisUtil')
const User = require('./user')

class Room {
  static roomList = {}
	static snapshot = {}
  static roomCount = 0
	static roomIndex = 0
	static HKEY = 'classroom:rooms'

  constructor (roomName, roomDesc, maxUser, roomId = undefined, addToList = true) {
		if (undefined === roomId) this.roomId = 'room_' + ++Room.roomIndex
		else this.roomId = roomId
    this.roomName = roomName
    this.roomDesc = roomDesc
    this.users = {}
		this.maxUser = maxUser

		if (addToList) {
			Room.roomList[this.roomId] = this
			this.saveToRedis(true)
		}

		Room.roomCount++
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
    if (this.users[user.userId]) {
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
			await redisUtil.hset(Room.HKEY, this.roomId, JSON.stringify(this.info))
			if (needSaveRoomCount)
				await redisUtil.hset(Room.HKEY, 'roomIndex', Room.roomIndex)
		} catch(err) {
			console.log(err)
		}
	}

	async deleteFromRedis () {
		try {
			await redisUtil.hdel(Room.HKEY, this.roomId)
		} catch(err) {
			console.log(err)
		}
	}

  static getRoom (roomId) {
    return Room.roomList[roomId]
  }

  static getRoomByUserId (userId) {
    for (var roomId in Room.roomList) {
      if (Room.roomList[roomId].users[userId]) return Room.roomList[roomId]
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
		return room instanceof Room
  }

	static async loadFromRedis () {
		try {
			let obj = await redisUtil.hgetall(Room.HKEY)
			if (null === obj) return

			Object.keys(obj).forEach((key) => {
				Room.createRoom(key, obj[key])
			})
		} catch(err) {
			console.log(err)
		}
	}

	static createRoom (roomId, strRoom) {
		try {
			if ('roomIndex' === roomId) {
				Room.roomIndex = Number(strRoom)
				return true
			}

			let obj = JSON.parse(strRoom)
			let room = new Room(obj.roomName, obj.roomDesc, obj.maxUser, obj.roomId, false)
			
			let user
			let o
			if (obj.users) {
				Object.keys(obj.users).forEach((key) => {
					o = obj.users[key]
					user = new User(o.userId, o.userName, o.userType, '', false)
					room.addUser(user)
				})
			}

			Room.snapshot[room.roomId] = room
			return room
		} catch(err) {
			console.log(err)
		}
	}
}

module.exports = Room
