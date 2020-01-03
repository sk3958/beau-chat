class Room {
  static roomList = {}
  static roomCount = 0

  constructor (roomName, roomDesc, maxUser) {
    this.roomId = 'room_' + ++Room.roomCount
    this.roomName = roomName
    this.roomDesc = roomDesc
    this.users = {}
    this.userCount = 0
		this.maxUser = maxUser

    Room.roomList[this.roomId] = this
  }

  addUser (user) {
    this.users[user.userId] = user
		user.roomId = this.roomId
    this.userCount++
  }

  deleteUser (user) {
    if (this.users.hasOwnProperty(user.userId)) {
			this.users[user.userId].roomId = ''
      delete this.users[user.userId]
      this.userCount--
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
console.log(obj)
    return obj
  }

  static isRoom (room) {
    if (undefined === room || null === room) return false
    return (room.hasOwnProperty('roomId') &&
      room.hasOwnProperty('roomName') &&
      room.hasOwnProperty('roomDesc') &&
      room.hasOwnProperty('users') &&
      room.hasOwnProperty('userCount') &&
		  room.hasOwnProperty('maxUser'))
  }
}

module.exports = Room
