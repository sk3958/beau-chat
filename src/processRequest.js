var User = require('./user')
var Room = require('./room')

var processRequest = function (io, socket, url, data) {
  switch (url) {
    case 'disconnect':
      deleteUser(io, socket)
      break
    case 'addUser':
      addUser(io, socket, data)
      break
    case 'roomList':
      sendRoomList(socket)
      break
    case 'userList':
      sendUserList(socket)
      break
    case 'createRoom':
      createRoom(io, socket, data)
      break
    case 'enterRoom':
      enterRoom(io, socket, data)
      break
    case 'leaveRoom':
      leaveRoom(io, socket, data)
      break
    case 'inviteRoom':
      inviteRoom(io, socket, data)
      break
    case 'refuseInvite':
      refuseInvite(io, socket, data)
      break
    default:
      break
  }
}

function addUser (io, socket, data) {
  var user = new User(data.userId, data.userName, data.userType, socket)
  io.sockets.emit('addUser', user.info)
}

function deleteUser (io, socket) {
  var user = User.getUserBySocketId(socket.id)

  if (user.userId) {
    var room = Room.getRoomByUser(user)
    if (null !== room) {
      room.deleteUser(user)
      if (0 === room.userCount) io.sockets.emit('deleteRoom', room.info)
    }

    user.destroy()
    io.sockets.emit('deleteUser', user.info)
  }
}

function sendRoomList (socket) {
  var data = Room.getRoomsInfo()
  socket.emit('roomList', data)
}

function sendUserList (socket) {
  var data = User.getUsersInfo()
  socket.emit('userList', data)
}

function createRoom (io, socket, data) {
  var user = User.getUserBySocketId(socket.id)
  if (user.userId) {
    var room = new Room(data.roomName, data.roomDesc)
    io.sockets.emit('createRoom', room.info)
    enterRoom(io, socket, { roomId: room.roomId, userId: user.userId })
  }
}

function enterRoom (io, socket, data) {
  var user = User.getUser(data.userId)
  if (user.userId) {
    var room = Room.getRoom(data.roomId)
    if (Room.MAX_MEMBER === room.userCount) {
      socket.emit('enterRoom', { result: 'fail', message: 'Room is full.' })
      return false
    }
    room.addUser(user)
    user.roomId = room.roomId
    io.sockets.emit('enterRoom', user.info)
    socket.join(room.roomId, () => {
      console.log(user.userId + ' has joind romm ' + room.roomId)
    })
  }
}

function leaveRoom (io, socket, data) {
  var user = User.getUser(data.userId)
  if (user.userId) {
    var room = Room.getRoom(user.roomId)
    if (room.roomId) {
      room.deleteUser(user)
      if (0 === room.userCount) io.sockets.emit('deleteRoom', room.info)
    }
    io.sockets.emit('leaveRoom', user.info)
    socket.leave(room.roomId, () => {
      console.log(user.userId + ' has left room ' + room.roomId)
    })
  }
}

function inviteRoom (socket, data) {
  var invitedUser = User.getUser(data.invitedId)
  var user = User.getUserBySocketId(socket.id)
  if (invitedUser.userId && user.userId) {
    var room = Room.getRoom(data.roomId)
    socket.broadcast.to(invitedUser.socketId).emit('inviteRoom', { user: user.info, room: room.info })
  }
}

function refuseInvite (socket, data) {
  var inviteUser = User.getUser(data.inviteId)
  var user = User.getUserBySocketId(socket.id)
  if (inviteUser.userId && user.userId) {
    socket.broadcast.to(inviteUser.socketId).emit('refuseInvite', user.info)
  }
}

module.exports = processRequest