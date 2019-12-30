Vue.component('my-video', {
  template: `
    <div id="video">
		  <p>{{ my_id }} {{ my_name }}</p>
		  <video id="myVideo" autoplay>
			  You have no camera or this browser does not support video tag.
			</video>
    </div>
  `,

  props: {
		my_id: String,
		my_name: String,
		is_room: Boolean
  },

  data: function () {
    return {
			myVideo: undefined
    }
  },

	watch: {
		is_room (value) {
			if (value) this.start()
			else this.stop()
		}
	},

	mounted () {
		this.myVideo = document.querySelector('#myVideo')
	},

  beforeDestroy () {
		this.stop()
	},

  methods: {
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
