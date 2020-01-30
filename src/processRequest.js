const User = require('./user')
const Room = require('./room')

const processRequest = async function (io, socket, url, data) {
// console.log('ip addr: ', url, socket.handshake.address)
	try {
		let isValidUser = await isValidConnection(socket, url, data)
		if (!isValidUser) {
			socket.disconnect()
console.warn('Invalid connection detected: ', url, data)
			return false
		}
	} catch(e) {
		console.log(e)
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
    case 'checkWasInRoom':
      checkWasInRoom(io, socket, data)
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
    case 'newMemberIsReady':
      relayRoomData(socket, 'newMemberIsReady', data)
      break
    case 'leaveRoom':
      leaveRoom(io, socket, data, true)
      break
    case 'inviteRoom':
      inviteRoom(socket, data)
      break
    case 'refuseInvite':
      refuseInvite(socket, data)
      break
    case 'acceptInvite':
    case 'doneReadyForNewMember':
    case 'canceledInvite':
    case 'roomIsReady':
    case 'pcSignaling':
      relayData(url, socket, data)
      break
    case 'needReenterRoom':
      registerReenterRoom(data)
      break
    case 'heartbeat':
      setUserAlive(data)
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
	let user = User.getUser(data.userId)
	if (User.isUser(user)) {
		user.socketId = socket.id
	} else {
		user = new User(data.userId, data.userName, data.userType, socket.id)
	}

  io.sockets.emit('addUser', JSON.stringify(user.info))
}

function deleteUser (io, socket) {
  var user = User.getUserBySocketId(socket.id)

  if (User.isUser(user)) {
    var room = Room.getRoomByUser(user)
    if (null !== room) {
			leaveRoom(io, socket, user, false)
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

function createRoom (io, socket, data, roomId = undefined) {
  var user = User.getUserBySocketId(socket.id)
  if (User.isUser(user)) {
    if ('' !== user.roomId) {
      socket.emit('requestFail', JSON.stringify({ message: 'Cannot create room when in room.'}))
      return false
    }
    var room = new Room(data.roomName, data.roomDesc, data.maxUser, roomId)
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

function leaveRoom (io, socket, data, fromUser) {
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

		if (fromUser) User.deleteReenterRoom(data.userId)
	}
}

function inviteRoom (socket, data) {
  var invitedUser = User.getUser(data.invitedId)
  var user = User.getUserBySocketId(socket.id)
  if (invitedUser.userId && user.userId) {
    socket.broadcast.to(invitedUser.socketId).emit('invitedRoom', JSON.stringify({ user: user.info }))
  }
}

function refuseInvite (socket, data) {
  var inviteUser = User.getUser(data.inviteId)
  var user = User.getUserBySocketId(socket.id)
  if (inviteUser.userId && user.userId) {
    socket.broadcast.to(inviteUser.socketId).emit('refusedInvite', JSON.stringify(user.info))
  }
}

function registerReenterRoom (data) {
	let user = User.getUser(data.userId)
	if (User.isUser(user)) user.registerReenterRoom(data.room)
}

function relayData (message, socket, data) {
  try {
    let user = User.getUser(data.to)
    if (User.isUser(user)) {
      socket.broadcast.to(user.socketId).emit(message, JSON.stringify(data))
    }
  } catch(e) {
		console.log(e)
  }
}

function relayRoomData (socket, message, data) {
	socket.broadcast.to(data.roomId).emit(message, JSON.stringify(data))
}

function isValidConnection (socket, url, data) {
	return new Promise((resolve, reject) => {
		if ('deleteUser' === url) return resolve(true)
		if ('disconnect' === url) return resolve(true)
		if ('pcSignaling' === url) return resolve(true)

		let user = User.getUserBySocketId(socket.id)
		if (User.isUser(user)) return resolve(true)

		if (!data) return resolve(false)

		user = User.getUser(data.userId)
		if (User.isUser(user)) return resolve(true)

		User.existsSession(data.userId)
			.then((rtn) => {
				return resolve(rtn)
			})
			.catch((err) => {
				return reject(err)
			})
	})
}

async function checkWasInRoom (io, socket, data) {
	try {
		let  objUser = await getWasInRoom(data) 
		if (!objUser) return

		let objRoom = objUser.room
		if (objRoom) {
			let room = Room.getRoom(objRoom.roomId)
			if (Room.isRoom(room)) {
				enterRoom(io, socket, { roomId: room.roomId, userId: objUser.userId })
			} else {
				createRoom(io, socket, {
					roomName: objRoom.roomName,
					roomDesc: objRoom.roomDesc,
					maxUser: objRoom.maxUser
				}, objRoom.roomId)
			}

			User.deleteReenterRoom(data.userId)
		}
	} catch(err) {
		console.log(err)
	}
}

function getWasInRoom (data) {
	return new Promise((resolve, reject) => {
		User.getInfoForReenterRoom(data.userId)
			.then((res) => {
				resolve(res)
			})
			.catch((err) => {
				console.log(err)
				reject(err)
			})
	})
}

async function setUserAlive (data) {
	try {
		await User.extendSessionTime(data.userId)
	} catch(err) {
		console.log(err)
	}
}

function debugClient (data/*, depth = 0*/) {
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
