let vue = new Vue({
  el: '#app',
  data: {
    my_id: '',
    my_name: '',
    my_type: '',
    my_status: 'waiting',
    socket: undefined,
    rooms: {},
    room_count: 0,
		room_maxs: [ 2, 3, 4, 5],
    users: {},
    user_count: 0,
    on_waiting: 0,
    on_room: 0,
		is_room: false,
		has_video: false,
		camStream: undefined,
		shareStream: undefined,
		recvMessage: {},
    messageToSend: {},
    fileToSend: undefined,
    on_enter: false,
    my_room: { users: {} },
    my_room_id: '',
    my_room_name: '',
		invitedId: '',
    peerVideos: [],
    log: undefined,
    dummy: 0,
		alert_title: '',
		alert_message: '',
		cancel_label: 'Cancel',
		confirm_label: 'OK',
		is_confirm_alert: false,
		alerts: [],
		on_alert: false
  },

  created() {
    this.my_id = info.userId
    this.my_name = info.userName
    this.my_type = info.userType
    this.log = this.myLog
    this.socket = io('', {
			autoConnect: false,
			transports: ['websocket']
		})

    window.addEventListener('beforeunload', (e) => {
			e.preventDefault()
			e.returnValue = ''

			/* if (this.is_room) this.sendLeaveRoom()
      this.socket.emit('deleteUser')
			this.socket.disconnect() */
		})

    window.onerror = (event, source, lineno, colno, error) => {
      this.myLog({ event: event, source: source, lineno: lineno, colno: colno, error: error })
    }

		this.socket.on('connect', () => {
			this.socket.emit('addUser', JSON.stringify({ userId: this.my_id, userName: this.my_name, userType: this.my_type }))
			this.socket.emit('roomList')
			this.socket.emit('userList')
		})

		this.socket.on('connect_error', (error) => {
			this.showMessage(error.message || 'cannot connect to server')
		})

		this.socket.on('disconnect', (reason) => {
			// 'io server disconnect', 'io client disconnect', 'ping timeout'
			if ('io client disconnect' !== reason) {
				setTimeout(() => {
					this.socket.connect()
				}, 5000)
			}
		})

    this.socket.on('addUser', (data) => {
      var user = JSON.parse(data)
      this.users[user.userId] = user
      this.updateUserList()
    })

    this.socket.on('deleteUser', (data) => {
      var user = JSON.parse(data)
      delete this.users[user.userId]
      this.updateUserList()
    })

    this.socket.on('roomList', (data) => {
      var roomList = JSON.parse(data)
      this.rooms = roomList
      this.room_count = Object.keys(this.rooms).length
    })

    this.socket.on('userList', (data) => {
      var userList = JSON.parse(data)
      this.users = userList
			this.updateUserList()
    })

    this.socket.on('createRoom', (data) => {
      var room = JSON.parse(data)
      this.rooms[room.roomId] = room
      this.room_count = Object.keys(this.rooms).length
    })

    this.socket.on('deleteRoom', (data) => {
      var room = JSON.parse(data)
      delete this.rooms[room.roomId]
      this.room_count = Object.keys(this.rooms).length
    })

    this.socket.on('enterRoom', (data) => {
      this.enterRoom(JSON.parse(data))
    })

		this.socket.on('newMemberIsReady', (data) => {
			this.readyForNewMember(JSON.parse(data))
		})

    this.socket.on('doneReadyForNewMember', (data) => {
			var user = this.my_room.users[JSON.parse(data).from]
			if (undefined !== user) this.addPeerVideo(user, true)
    })

    this.socket.on('leaveRoom', (data) => {
      this.leaveRoom(JSON.parse(data))
    })

    this.socket.on('invitedRoom', (data) => {
      this.invitedRoom(JSON.parse(data))
    })

		this.socket.on('acceptInvite', (data) => {
			this.makePrivateRoom(JSON.parse(data))
		})

    this.socket.on('refusedInvite', (data) => {
      this.refusedInvite(JSON.parse(data))
    })

    this.socket.on('roomIsReady', (data) => {
			if (this.is_room) return
      this.socket.emit('enterRoom',
				JSON.stringify({
					userId: this.my_id,
					roomId: JSON.parse(data).roomId
				}))
    })

    this.socket.on('requestFail', (data) => {
      this.showMessage('requestFail', 'Notification', JSON.parse(data).message)
    })

		this.socket.open()
  },

  methods: {
    addPeerVideo (user, needOffer) {
      let param = {
        socket: this.socket,
        my_id: this.my_id,
        peer_id: user.userId,
        peer_name: user.userName,
        camStream: this.camStream,
        shareStream: this.shareStream,
        messageToSend: this.messageToSend,
        fileToSend: this.fileToSend,
        offer: needOffer,
        has_video: this.has_video
      }
      let peerVideo = Vue.extend(PeerVideo)
      let instance = new peerVideo({ propsData: param })
			this.peerVideos.push(instance)
      instance.$mount()
      this.$refs.peers.appendChild(instance.$el)
      instance.initialize(this.myLog, this.changeProp, this.showMessage)
    },

    removePeerVideo (userId) {
      var elem = document.getElementById(userId)
			if (undefined !== elem && null !== elem) this.$refs.peers.removeChild(elem.parentElement)

			this.peerVideos.forEach((peerVideo, index) => {
				if (peerVideo.peer_id === userId) {
					peerVideo.peer_id = ''
					peerVideo.my_id = ''
					if (undefined !== peerVideo.pc) {
						peerVideo.pc.close()
						peerVideo.pc = undefined
					}
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
				//this.launchFullScreen(document.body)
        this.my_status = 'in room ' + data.roomId
        this.is_room = true
        this.my_room = room
        this.my_room_id = room.roomId
        this.my_room_name = room.roomName
      }

      this.updateUserList(data)
      this.updateRoomList()
    },

		makePrivateRoom (data) {
			if (this.is_room) {
				this.socket.emit('canceledInvite', JSON.stringify({ from: this.my_id, to: data.from }))

				return
			}

			this.invitedId = data.from
      this.socket.emit('createRoom', JSON.stringify({ roomName: 'Private', roomDesc: 'Private', maxUser: 2 }))
		},

		readyForNewMember (data) {
			if (this.my_id === data.userId) return
			if (this.my_room_id === data.roomId) {
      	this.addPeerVideo(data, false)
			}
		},

    leaveRoom (data) {
      if (data.roomId === this.my_room_id && data.user.userId !== this.my_id) {
        this.removePeerVideo(data.user.userId)
      }

      var room = this.rooms[data.roomId]
      delete room.users[data.user.userId]
      room.userCount = room.userCount - 1
      this.updateUserList(data.user)
			this.updateRoomList()
    },

    invitedRoom (data) {
      let user = data.user
      let message = `Invited from ${user.userName}(${user.userId}). Accept?`

      this.confirmMessage('invitedRoom', 'Confirm', message, 'Refuse', 'Accept', data)
    },

    refusedInvite (data) {
      let message = `${data.userName}(${data.userId}) refused your invitation.`
      this.showMessage('refusedInvite', 'Sorry', message)
    },

		clearMyRoom () {
			for (userId in this.my_room.users) {
				if (userId !== this.my_id) this.removePeerVideo(userId)
			}
			this.my_status = 'waiting'
			this.is_room = false
			this.my_room = undefined
			this.my_room_id = ''
			this.my_room_name = ''
			//this.exitFullScreen()
		},

    sendLeaveRoom () {
			this.clearMyRoom()
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

		onVideoInfo (hasVideo, stream, isCam) {
			if (!isCam) {
				this.srcStream = stream
				return
			}

			this.has_video = hasVideo
			this.camStream = stream

			if ('' !== this.invitedId) {
				this.socket.emit('roomIsReady',
					JSON.stringify({
						from: this.my_id,
						to: this.invitedId,
						roomId: this.my_room_id
					}))
				this.invitedId = ''
			} else if (0 === this.peerVideos.length) {
				this.socket.emit('newMemberIsReady',
					JSON.stringify({ userId: this.my_id, roomId: this.my_room_id }))
			}
    },

    showMessage (origin, title, message) {
			var msg = {
        origin: origin,
				title: title,
				message: message,
				isConfirm: false,
				cancelLabel: '',
				confirmLabel: 'OK',
				data: null
			}
			this.alerts.push(msg)
			this.showMessageBox ()
    },

    confirmMessage (origin, title, message, cancelLabel = 'Cancel', confirmLabel = 'OK', data = null) {
			var msg = {
        origin: origin,
				title: title,
				message: message,
				isConfirm: true,
				cancelLabel: cancelLabel,
				confirmLabel: confirmLabel,
				data: data
			}
			this.alerts.push(msg)
			this.showMessageBox ()
    },

		showMessageBox () {
			if (1 > this.alerts.length) {
				this.on_alert = false
				return false
			}

			var msg = this.alerts[0]
			this.alert_title = msg.title
			this.alert_message = msg.message
			this.cancel_label = msg.cancelLabel
			this.confirm_label = msg.confirmLabel
			this.is_confirm_alert = msg.isConfirm
			this.on_alert = true
		},

		onAlertConfirm () {
			this.on_alert = false
			var msg = this.alerts.shift()

			if (!msg.isConfirm) {
				this.showMessageBox()
				return false
			}

      switch(msg.origin) {
				case 'invitedRoom':
					this.socket.emit('acceptInvite',
						JSON.stringify({ to: msg.data.user.userId, from: this.my_id }))
					break
				default:
					break
			}

			this.showMessageBox
			return true
		},

		onAlertCancel () {
			this.on_alert = false
			var msg = this.alerts.shift()

      switch(msg.origin) {
				case 'invitedRoom':
        this.socket.emit('refuseInvite', JSON.stringify({ inviteId: msg.data.user.userId }))
					break
				default:
					break
			}

			this.showMessageBox
			return true
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
		},

		changeProp (propName, value) {
			switch (propName) {
				case 'shareStream':
          this.setShareStream(value)
					break
				case 'recvMessage':
					this.recvMessage = value
					break	
				case 'fileToSend':
          this.sendFile(value)
					break	
				case 'messageToSend':
          this.sendMessage(value)
					break	
				default:
					break
			}
    },
    
    setShareStream (stream) {
      this.shareStream = stream
			this.peerVideos.forEach((peerVideo) => {
        peerVideo.shareStream = stream
			})
    },

    sendMessage (message) {
      this.messageToSend = message
			this.peerVideos.forEach((peerVideo) => {
        peerVideo.messageToSend = message
			})
    },

    sendFile (file) {
      this.fileToSend = file
			this.peerVideos.forEach((peerVideo) => {
        peerVideo.fileToSend = file
			})
    }
  }
})
