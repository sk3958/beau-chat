var User = require('./user')
var Room = require('./room')

var processRequest = function (io, socket, url, data) {
	if (!isValidConnection(socket, url, data)) {
		// socket.disconnect()
		console.warn('Invalid connection detected: ',url, socket.handshake)
		// return false
	}

  switch (url) {
    case 'disconnect':
      deleteUser(io, socket)
      break
    case 'error':
      deleteUser(io, socket)
      break
    case 'addUser':
      addUser(io, socket, data)
      break
    case 'deleteUser':
      deleteUser(io, socket)
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
    case 'doneReadyForNewMember':
      relayData('doneReadyForNewMember', data)
      break
    case 'leaveRoom':
      leaveRoom(io, socket, data)
      break
    case 'inviteRoom':
      inviteRoom(socket, data)
      break
    case 'acceptInvite':
      acceptInvite(io, socket, data)
      break
    case 'refuseInvite':
      refuseInvite(socket, data)
      break
    case 'pcSignaling':
      relayData('pcSignaling', data)
      break
    case 'log':
      debugClient(data)
      break
    default:
			console.log(url)
      break
  }
}

function addUser (io, socket, data) {
  var user = new User(data.userId, data.userName, data.userType, socket)
  io.sockets.emit('addUser', JSON.stringify(user.info))
}

function deleteUser (io, socket) {
  var user = User.getUserBySocketId(socket.id)

  if (User.isUser(user)) {
    var room = Room.getRoomByUser(user)
    if (null !== room) {
			leaveRoom(io, socket, user)
    }

    user.destroy()
    io.sockets.emit('deleteUser', JSON.stringify(user.info))
  }

	socket.disconnect()
}

function sendRoomList (socket) {
  var data = Room.getRoomsInfo()
  socket.emit('roomList', JSON.stringify(data))
}

function sendUserList (socket) {
  var data = User.getUsersInfo()
  socket.emit('userList', JSON.stringify(data))
}

function createRoom (io, socket, data) {
  var user = User.getUserBySocketId(socket.id)
  if (User.isUser(user)) {
    if ('' !== user.roomId) {
      user.socket.emit('requestFail', JSON.stringify({ message: 'Cannot create room when in room.'}))
      return false
    }
    var room = new Room(data.roomName, data.roomDesc, data.maxUser)
    io.sockets.emit('createRoom', JSON.stringify(room.info))
    enterRoom(io, socket, { roomId: room.roomId, userId: user.userId })
  }
}

function enterRoom (io, socket, data) {
  var user = User.getUser(data.userId)
  if (User.isUser(user)) {
    var room = Room.getRoom(data.roomId)
    if (Room.isRoom(room) && room.maxUser === room.userCount) {
      socket.emit('requestFail', JSON.stringify({ message: 'This room is full.' }))
      return false
    }
    room.addUser(user)
    user.roomId = room.roomId
    io.sockets.emit('enterRoom', JSON.stringify(user.info))
    socket.join(room.roomId, () => {
    })
  }
}

function leaveRoom (io, socket, data) {
  var user = User.getUser(data.userId)
  if (User.isUser(user)) {
    var room = Room.getRoom(user.roomId)
    if (Room.isRoom(room)) {
      room.deleteUser(user)
      io.sockets.emit('leaveRoom', JSON.stringify({ user: user.info, roomId: room.roomId }))
      socket.leave(room.roomId, () => {
      })
      if (0 === room.userCount) io.sockets.emit('deleteRoom', JSON.stringify(room.info))
    }
  }
}

function inviteRoom (socket, data) {
  var invitedUser = User.getUser(data.invitedId)
  var user = User.getUserBySocketId(socket.id)
  if (invitedUser.userId && user.userId) {
    socket.broadcast.to(invitedUser.socketId).emit('invitedRoom', JSON.stringify({ user: user.info }))
  }
}

function acceptInvite (io, socket, data) {
  var inviteUser = User.getUser(data.inviteId)
  var invitedUser = User.getUser(data.invitedId)

	if (User.isUser(inviteUser) && '' !== inviteUser.roomId) {
    socket.emit('requestFail', JSON.stringify({ message: `${inviteUser.userName}(${inviteUser.userId}) is in another room already.` }))
		return false
	}

	createRoom(io, inviteUser.socket, {
		roomName: 'Private',
		roomDesc: 'Private',
		maxUser: 2
	})

	enterRoom(io, socket, { roomId: inviteUser.roomId, userId: data.invitedId })
}

function refuseInvite (socket, data) {
  var inviteUser = User.getUser(data.inviteId)
  var user = User.getUserBySocketId(socket.id)
  if (inviteUser.userId && user.userId) {
    socket.broadcast.to(inviteUser.socketId).emit('refusedInvite', JSON.stringify(user.info))
  }
}

function relayData (message, data) {
  try {
    let user = User.getUser(data.to)
    if (User.isUser(user)) {
      user.socket.emit(message, JSON.stringify(data))
    }
  } catch(e) {
  }
}

function isValidConnection (socket, url, data) {
	if ('deleteUser' === url) return true
	if ('disconnect' === url) return true

	let user
	if ('addUser' === url) {
		user = User.getUser(data.userId)
	} else {
		user = User.getUserBySocketId(socket.id)
	}

	if (!User.isUser(user)) return false

	return true
}

function debugClient (data, depth = 0) {
  console.log('debugClient : ', data)
  /* let space = ''
  for (let i = 0; i < depth; i++) space += '  '

  if (typeof data === 'object') {
    console.log(space + '{')
    for (var key in Object.keys(data)) {
      if (typeof Object.values(data)[key] === 'object') {
        console.log(space + '  ' + Object.keys(data)[key] + ': ' + (Object.values(data)[key]))
        debugClient(Object.values(data)[key], ++depth)
      } else {
        console.log(space + '  ' + Object.keys(data)[key] + ': ' + Object.values(data)[key])
      }
    }
    console.log(space + '}')
  } else {
    console.log(data)
  } */
}

module.exports = processRequest
