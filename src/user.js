class User {
  static userList = {}

  constructor (userId, userName, userType, socket) {
    this.userId = userId
    this.userName = userName
    this.userType = userType
    this.socketId = socket.id
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
      roomId: this.roomId > 'a' ? this.roomId : 'waiting'
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
}

module.exports = User