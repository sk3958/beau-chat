Vue.component('rooms-info', {
  props: {
    socket: Object,
    rooms: Object,
    room_count: Number,
		my_id: String,
    my_status: String,
		room_maxs: Array
  },
  data: function () {
    return {
      room_name: '',
      room_desc: '',
			max_user: 6
    }
  },

  template: `
    <div id="rooms_info">
      <ul>
        <div>
          <p>Current Room Count: {{ room_count }}&nbsp;&nbsp;My Status: {{ my_id }}({{ my_status }})</p>
          <label for="room-name">Room Name:</label>
          <input v-model="room_name" name="room-name"/>
          <label for="room-desc">Room Description</label>
          <input v-model="room_desc" name="room-desc"/>
					<label for="max-user">Max User:</label> 
					<select v-model="max_user" name="max-user">
					  <option v-for="value in room_maxs" :value="value"> {{ value }} people </option>
					</select>
          <li>
            <a href="#" v-on:click="createRoom()">Create Room</a>
          </li>
        </div>
        <span><br></span>
        <div>
          <li v-for="room in rooms" :key="room.memberCount">
            <p>{{ room.roomId }} ({{ room.roomName }})&nbsp;Participant : {{ room.userCount }}/{{ room.maxUser }}</p>
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
      this.socket.emit('createRoom', JSON.stringify({ roomName: this.room_name, roomDesc: this.room_desc, maxUser: this.max_user }))
    },

    enterRoom (roomId) {
      this.socket.emit('enterRoom', JSON.stringify({ userId: this.my_id, roomId: roomId }))
    }
  }
})
