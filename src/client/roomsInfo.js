Vue.component('rooms-info', {
  props: {
    socket: Object,
    rooms: Object,
    room_count: Number,
		my_id: String,
    my_status: String
  },
  data: function () {
    return {
      room_name: '',
      room_desc: '',
    }
  },

  template: `
    <div id="rooms_info">
      <ul>
        <div>
          <p>Current Room Count: {{ room_count }}&nbsp;&nbsp;My Status: {{ my_id }}({{ my_status }})</p>
          <label for="room-name">Room Name: </label>
          <input v-model="room_name" />
          <label for="room-desc">Room Description: </label>
          <input v-model="room_desc" />
          <li>
            <a href="#" v-on:click="createRoom()">Create Room</a>
          </li>
        </div>
        <span><br></span>
        <div>
          <li v-for="room in rooms">
            <p>{{ room.roomId }} ({{ room.roomName }})</p>
            <p>{{ room.roomDesc }}</p>
            <p v-for="user in room.users">{{ user.userName }}({{ user.userId }}),</p>
            <a href="#" v-on:click="enterRoom(room.roomId)">Enter Room</a>
          </li>
        </div>
      </ul>
    </div>
  `,

  methods: {
    createRoom () {
      this.socket.emit('createRoom', { roomName: this.room_name, roomDesc: this.room_desc })
    },

    enterRoom (roomId) {
      this.socket.emit('enterRoom', { userId: this.my_id, roomId: roomId })
    }
  }
})
