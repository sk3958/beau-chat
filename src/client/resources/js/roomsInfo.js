Vue.component('rooms-info', {
  props: {
    rooms: Object,
    room_count: Number,
		my_id: String,
    my_status: String,
		room_maxs: Array,
		dummy: Number
  },
  data: function () {
    return {
      room_name: '',
      room_desc: '',
			max_user: 5
    }
  },

  template: `
		<div id="rooms_info">
			<div style="text-align: right;">My Status: {{ my_id }}({{ my_status }})<span class="dummy">{{ dummy }}</span></div>
			<h1>Rooms Information</h1>
			<p>Current Room Count: {{ room_count }}</p>
			<div>
				<table><thead><tr>
					<th>Room ID</th>
					<th>Room name</th>
					<th>Room Description</th>
					<th>Participants</th>
					<th>Enterance</th>
				</tr></thead>
				<tbody v-for="room in rooms" :key="room.userCount">
					<tr>
						<td>{{ room.roomId }}</td>
						<td>{{ room.roomName }}</td>
						<td>{{ room.roomDesc }}</td>
						<td>{{ room.userCount }}/{{ room.maxUser }}</td>
						<td><button type="button" :disabled="room.userCount === room.maxUser" v-on:click="enterRoom(room.roomId)">Enter Room</button></td>
					</tr>
				</tbody></table>
			</div>
			<div>
				<br><h2>Make Room</h2>
				<label for="room-name">Room Name</label>
				<input v-model="room_name" name="room-name"/>
				<label for="room-desc">Description</label>
				<input v-model="room_desc" name="room-desc"/>
				<label for="max-user">Max User</label> 
				<select v-model="max_user" name="max-user">
					<option v-for="value in room_maxs" :value="value"> {{ value }} people </option>
				</select>
				<button type="button"  v-on:click="createRoom()">Create Room</button>
			</div>
    </div>
  `,

  methods: {
    createRoom () {
      this.socket('createRoom', { roomName: this.room_name, roomDesc: this.room_desc, maxUser: this.max_user })
    },

    enterRoom (roomId) {
      this.socket('enterRoom', { userId: this.my_id, roomId: roomId })
    },

		socket (message, data) {
			this.$emit('socket', message, data)
		}
  }
})
