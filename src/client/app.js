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
    users: {},
    user_count: 0,
    on_waiting: 0,
    on_room: 0,
		is_room: false,
		has_video: false,
		stream: undefined,
		video: undefined,
		audio: undefined
  },

  created() {
    this.my_id = 'sk3958'
    this.my_name = 'soonkoo'
    this.my_type = '99'
    socket.emit('addUser', { userId: this.my_id, userName: this.my_name, userType: this.my_type })
    socket.emit('roomList')
    socket.emit('userList')

    window.onbeforeunload = () => {
      socket.emit('deleteUser')
    }

    socket.on('roomList', (data) => {
      this.rooms = data
      this.room_count = Object.keys(this.rooms).length
    })

    socket.on('userList', (data) => {
      this.users = data
			this.updateUserList(null)
    })

    socket.on('createRoom', (data) => {
      this.rooms[data.roomId] = data
      this.room_count = Object.keys(this.rooms).length
    })

    socket.on('enterRoom', (data) => {
      var room = this.rooms[data.roomId]
      room.users[data.userId] = data
      room.userCount++
			this.updateUserList(data)

      if (data.userId === this.my_id) {
				this.my_status = 'in room ' + data.roomId
        this.is_room = true
			}
    })
  },

  methods: {
		updateUserList (user) {
			if (null !== user) {
				this.users[user.userId].roomId = user.roomId
			}

      this.user_count = Object.keys(this.users).length

      var on_wating = 0
      var on_room = 0
      for (user in this.users) {
        if (this.users[user].roomId !== 'waiting') on_room++
        else on_wating++
      }
      this.on_waiting = on_wating
      this.on_room = on_room
		},

		onVideoInfo (hasVideo, stream, video, audio) {
			this.has_video = hasVideo
			if (hasVideo) {
				this.stream = stream
				this.video = video
				this.audio = audio
			} else {
				this.stream = undefined
				this.video = undefined
				this.audio = undefined
			}
		}
  }
})
