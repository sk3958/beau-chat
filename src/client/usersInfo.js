Vue.component('users-info', {
  props: {
    socket: Object,
    users: Object,
    user_count: Number,
    on_waiting: Number,
    on_room: Number
  },

  template: `
    <div id="users_info">
      <ul>
        <div>
          <p>Current User Count: {{ user_count }}&nbsp;(On Waiting: {{ on_waiting }},&nbsp;On Room: {{ on_room }})</p>
        </div>
        <div>
          <li v-for="user in users">
            <p>{{ user.userId }} ({{ user.userName }})-{{ user.roomId }}</p>
          </li>
        </div>
      </ul>
    </div>
  `,

  methods: {
  }
})
