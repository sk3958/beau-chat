Vue.component('users-info', {
  props: {
    socket: Object,
    users: Object,
    user_count: Number,
    on_waiting: Number,
    on_room: Number,
    my_id: String,
    log: Function
  },

  template: `
    <div id="users_info">
      <br><br><h1>Users Infomation</h1>
      <p>Current User Count: {{ user_count }}&nbsp;(On Waiting: {{ on_waiting }},&nbsp;On Room: {{ on_room }})</p>
			<table><thead><tr>
				<th>User ID</th>
				<th>User Name</th>
				<th>User Type</th>
				<th>Status</th>
				<th>Private Chat</th>
			</tr></thead>
			<tbody><tr v-for="user in users">
				<td>{{ user.userId }}</td>
				<td>{{ user.userName }}</td>
				<td>{{ user.userType }}</td>
				<td>{{ user.roomId }}</td>
        <td>
          <button type="button"
            :disabled="user.roomId !== 'waiting' || user.userId === my_id"
            v-on:click="inviteRoom(user.userId)">Request Private Chat</button>
        </td>
			</tr></tbody></table>
    </div>
  `,

  methods: {
    inviteRoom(userId) {
      this.socket.emit('createRoom', JSON.stringify({ roomName: 'Private', roomDesc: 'Private', maxUser: 2 }))
      this.socket.emit('inviteRoom', JSON.stringify({ invitedId: userId }))
    }
  }
})
