Vue.component('peer-video', {
  template: `
    <div v-if="user_id != my_id">
		  <p>{{ user_id }} {{ user_name }}</p>
		  <video autoplay></video>
    </div>
  `,

  props: {
		socket: Object,
		my_id: String,
		peer_id: String,
		peer_name: String,
		stream: Object,
		video: Array,
		audio: Array,
		offer: Boolean
  },

  data: function () {
    return {
			pc: undefined
    }
  },

	watch: {
	},

	created () {
		this.socket.on('pcSignaling', (data) => {
			if (data.from === this.user_id) {
				this.processSignaling(data)
			}
		})
	},

  beforeDestroy () {
		this.pc.close()
	},

  methods: {
		processSignaling (data) {
		},

		start () {
			if (navigator.getUserMedia) {
			  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
					.then(stream => {
						this.myVideo.srcObject = stream
						const video = stream.getVideoTracks()
						const audio = stream.getAudioTracks()

						this.$emit('video_info', true, stream, video, audio)
						})
					.catch(err => {
						this.$emit('video_info', false)
					})
			} else {
				this.$emit('video_info', false)
			}
		},

		stop () {
			try {
				this.myVideo.pause()
			} catch(e) {
			}
		}
  }
})
