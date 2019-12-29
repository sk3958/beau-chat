class Room {
  static MAX_MEMBER = 4
  static roomList = {}
  static roomCount = 0

  constructor (roomName, roomDesc) {
    this.roomId = 'room_' + ++Room.roomCount
    this.roomName = roomName
    this.roomDesc = roomDesc
    this.users = {}
    this.userCount = 0

    Room.roomList[this.roomId] = this
  }

  addUser (user) {
    this.users[user.userId] = user
    this.userCount++
  }

  deleteUser (user) {
    if (this.users.hasOwnProperty(user.userId)) {
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
    return getRoomByUserId(user.userId)
  }

  static getRoomsInfo () {
    var obj = {}
    for (var roomId in Room.roomList) obj[roomId] = Room.roomList[roomId].info
    return obj
  }
}

module.exports = Room