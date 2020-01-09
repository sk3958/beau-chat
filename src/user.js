class User {
  static userList = {}

  constructor (userId, userName, userType, socket = null) {
    this.userId = userId
    this.userName = userName
    this.userType = userType
    this.socket = socket || null
    this.socketId = null === this.socket ? null : socket.id
    this.status = 0
    this.roomId = '' 

    User.userList[this.userId] = this
  }

  destroy () {
    delete User.userList[this.userId]
  }

  get info () {
    return {
      userId: this.userId,
      userName: this.userName,
      userType: this.userType,
      roomId: this.roomId
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
    if (undefined === user || null === user) return false
    return (user.hasOwnProperty('userId') &&
      user.hasOwnProperty('userName') &&
      user.hasOwnProperty('userType') &&
      user.hasOwnProperty('socket') &&
      user.hasOwnProperty('socketId') &&
      user.hasOwnProperty('status') &&
      user.hasOwnProperty('roomId'))
  }
}

module.exports = User
