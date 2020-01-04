var socket = io('')

let vue = new Vue({
  el: '#app',
  data: {
    my_id: '',
    my_name: '',
    my_type: '',
    my_status: 'waiting',
    socket: socket,
    rooms: {},
    room_count: 0,
		room_maxs: [ 2, 3, 4, 5, 6 ],
    users: {},
    user_count: 0,
    on_waiting: 0,
    on_room: 0,
		is_room: false,
		has_video: false,
		stream: undefined,
    on_enter: false,
    my_room: { users: {} },
    my_room_id: '',
    my_room_name: '',
    my_room_member_count: 0,
    peerVideos: [],
    log: undefined,
    dummy: 0
  },

  created() {
    this.my_id = 'M_' + Math.floor(Math.random() * 1000000)
    this.my_name = 'soonkoo'
    this.my_type = '99'
    this.log = this.myLog
    socket.emit('addUser', JSON.stringify({ userId: this.my_id, userName: this.my_name, userType: this.my_type }))
    socket.emit('roomList')
    socket.emit('userList')

    window.onbeforeunload = () => {
      socket.emit('deleteUser')
			socket.disconnect()
    }

    window.onerror = (event, source, lineno, colno, error) => {
      this.myLog({ event: event, source: source, lineno: lineno, colno: colno, error: error })
    }

    socket.on('addUser', (data) => {
      var user = JSON.parse(data)
      this.users[user.userId] = user
      this.updateUserList()
    })
    socket.on('deleteUser', (data) => {
      var user = JSON.parse(data)
      delete this.users[user.userId]
      this.updateUserList()
    })
    socket.on('roomList', (data) => {
      var roomList = JSON.parse(data)
      this.rooms = roomList
      this.room_count = Object.keys(this.rooms).length
    })
    socket.on('userList', (data) => {
      var userList = JSON.parse(data)
      this.users = userList
			this.updateUserList()
    })
    socket.on('createRoom', (data) => {
      var room = JSON.parse(data)
      this.rooms[room.roomId] = room
      this.room_count = Object.keys(this.rooms).length
    })
    socket.on('deleteRoom', (data) => {
      var room = JSON.parse(data)
      delete this.rooms[room.roomId]
      this.room_count = Object.keys(this.rooms).length
    })
    socket.on('enterRoom', (data) => {
      this.enterRoom(JSON.parse(data))
    })
    socket.on('leaveRoom', (data) => {
      this.leaveRoom(JSON.parse(data))
    })
    socket.on('invitedRoom', (data) => {
      this.invitedRoom(JSON.parse(data))
    })
    socket.on('refusedInvite', (data) => {
      this.refusedInvite(JSON.parse(data))
    })
    socket.on('requestFail', (data) => {
      this.showMessage(JSON.parse(data).message)
    })

  },

  methods: {
    addPeerVideo (user) {
      let param = {
        socket: this.socket,
        my_id: this.my_id,
        peer_id: user.userId,
        peer_name: user.userName,
        stream: this.stream,
        offer: this.on_enter,
        has_video: this.has_video,
        log: this.log
      }
      let peerVideo = Vue.extend(PeerVideo)
      let instance = new peerVideo({ propsData: param })
			this.peerVideos.push(instance)
      instance.$mount()
      this.$refs.chat_room.appendChild(instance.$el)
      instance.initialize()
    },

    removePeerVideo (userId) {
      var elem = document.getElementById(userId).parentElement
      this.$refs.chat_room.removeChild(elem)

			this.peerVideos.forEach((peerVideo, index) => {
				if (peerVideo.peer_id === userId) {
					peerVideo.peer_id = ''
					peerVideo.my_id = ''
					peerVideo.pc.close()
					peerVideo = undefined
					this.peerVideos.splice(index, 1)
				}
			})
    },

    enterRoom (data) {
      var room = this.rooms[data.roomId]
      room.users[data.userId] = data
      room.userCount = room.userCount + 1

      if (data.userId === this.my_id) {
				this.launchFullScreen(document.body)
        this.my_status = 'in room ' + data.roomId
        this.is_room = true
        this.my_room = room
        this.my_room_id = room.roomId
        this.my_room_name = room.roomName

        this.on_enter = true
        for (userId in room.users) {
          if (userId !== this.my_id) this.addPeerVideo(room.users[userId])
        }
        this.on_enter = false
      } else if (data.roomId === this.my_room_id) {
        this.addPeerVideo(data)
        this.my_room_member_count = room.userCount
      }

      this.updateUserList(data)
      this.updateRoomList()
    },

    leaveRoom (data) {
      if (data.user.userId === this.my_id) {
        for (userId in this.my_room.users) {
          if (userId !== this.my_id) this.removePeerVideo(userId)
        }
        this.my_status = 'waiting'
        this.is_room = false
        this.my_room = undefined
        this.my_room_id = ''
        this.my_room_name = ''
				this.exitFullScreen()
      } else if (data.roomId === this.my_room_id) {
        this.removePeerVideo(data.user.userId)
        this.my_room_member_count--
      }

      var room = this.rooms[data.roomId]
      delete room.users[data.user.userId]
      room.userCount = room.userCount - 1
      this.updateUserList(data.user)
    },

    invitedRoom (data) {
      let user = data.user
      let room = data.room
      let message = `Invited from ${user.userName}(${user.userId}). Accept?`

      if (this.confirmMessage(message)) {
        this.socket.emit('enterRoom', JSON.stringify({ userId: this.my_id, roomId: room.roomId }))
      } else {
        this.socket.emit('refuseInvite', JSON.stringify({ inviteId: user.userId }))
      }
    },

    refusedInvite (data) {
      let message = `${data.userName}(${data.userId}) refused your invitation.`
      this.showMessage(message)
    },

    sendLeaveRoom () {
      this.socket.emit('leaveRoom', JSON.stringify({ userId: this.my_id }))
    },

		updateUserList (user = null) {
			if (null !== user) {
				this.users[user.userId].roomId = user.roomId
			}

      this.user_count = Object.keys(this.users).length

      var on_waiting = 0
      var on_room = 0
      for (user in this.users) {
        if (0 === this.users[user].roomId.length) this.users[user].roomId = 'waiting'
        if (this.users[user].roomId === 'waiting') on_waiting++
        else on_room++
      }
      this.on_waiting = on_waiting
      this.on_room = on_room
    },
    
    updateRoomList () {
      this.dummy++
    },

		onVideoInfo (hasVideo, stream) {
			this.has_video = hasVideo
			if (hasVideo) {
				this.stream = stream
			} else {
				this.stream = undefined
			}
    },

    showMessage (message) {
      window.alert(message)
    },

    confirmMessage (message) {
      return window.confirm(message)
    },

		myLog (msg) {
			console.log(msg)
			if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
				this.socket.emit('log', JSON.stringify({ userId: this.my_id, msg: msg }))
		},

		launchFullScreen (element) { 
			if (element.requestFullScreen) {
				element.requestFullScreen()
			} else if (element.mozRequestFullScreen) {
				element.mozRequestFullScreen()
			} else if (element.webkitRequestFullScreen) {
				element.webkitRequestFullScreen()
			}
		},

		exitFullScreen () {
      var el = document.fullscreenElement || document.mozFullscreenElement || document.webkitFullscreenElement
      if (null === el) return

      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.mozExitFullscreen) {
        document.mozExitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else {
        window.alert('cannot cancelFullscreen')
      }
		}
  }
})
