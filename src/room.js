const RedisUtil = require('./redisUtil')
const User = require('./user')

class Room {
  static roomList = {}
	static snapshot = {}
  static roomCount = 0
	static roomIndex = 0

  constructor (roomName, roomDesc, maxUser, roomId = undefined, addToList = true) {
		if (undefined === roomId) this.roomId = 'room_' + ++Room.roomIndex
		else this.roomId = roomId
    this.roomName = roomName
    this.roomDesc = roomDesc
    this.users = {}
		this.maxUser = maxUser

		if (addToList) {
			Room.roomList[this.roomId] = this
		}

		Room.roomCount++
  }

	get userCount () {
		return Object.keys(this.users).length
	}

  addUser (user) {
    this.users[user.userId] = user
		user.roomId = this.roomId
  }

  deleteUser (user) {
    if (this.users[user.userId]) {
			this.users[user.userId].roomId = ''
      delete this.users[user.userId]
    }
    if (0 === this.userCount) this.destroy()
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
}

module.exports = Room
