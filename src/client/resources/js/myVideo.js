Vue.component('my-video', {
  template: `
    <div id="my_video">
			<video v-show="this.hasVideo" id="myVideo" autoplay controls playsinline muted>
				You have no camera or this browser does not support video tag.
			</video>
			<canvas v-show="!this.hasVideo" id="no_camera"></canvas>
    </div>
  `,

  props: {
		my_id: String,
		my_name: String,
		is_room: Boolean
  },

  data: function () {
    return {
			hasVideo: false,
			myVideo: undefined,
			noCamera: undefined,
			camStream: undefined
    }
  },

	watch: {
		is_room (value) {
			if (value) this.start()
			else this.stop()
		}
	},

	mounted () {
		this.myVideo = document.getElementById('myVideo')
		this.noCamera = document.getElementById('no_camera')
	},

  beforeDestroy () {
		this.stop()
	},

  methods: {
		getVideoStream (callback) {
			const constraints = {
				video: true,
				audio: true
			}

			if (navigator.getUserMedia && navigator.appVersion.indexOf('SamsungBrowser') <= 0) {
				navigator.mediaDevices.getUserMedia(constraints)
					.then((stream) => {
						this.camStream = stream
						this.hasVideo = true
						this.$emit('video_info', this.hasVideo, this.camStream, true)
						callback()
					})
					.catch((err) => {
						this.log(err.message)
						this.hasVideo = false
						this.drawNoCamera()
						this.$emit('video_info', this.hasVideo, this.camStream, true)
						callback()
					})
			} else {
				this.log('navigator.getUserMedia failed')
				this.hasVideo = false
				this.drawNoCamera()
				this.$emit('video_info', this.hasVideo, this.camStream, true)
				callback()
			}
		},

		drawNoCamera () {
			let ctx = this.noCamera.getContext('2d')
			ctx.fillStyle = '#f1f1f1'
			ctx.fillRect(0, 0, this.noCamera.clientWidth, this.noCamera.clientHeight)
		},

		start () {
			this.getVideoStream(() => {
				try {
					if (undefined !== this.camStream) this.myVideo.srcObject = this.camStream
				} catch(e) {
					this.log(e.message || e)
				}
			})
		},

		stop () {
			try {
				this.myVideo.pause()
				if ('' === this.myVideo.src) this.myVideo.srcObject = undefined
				
				this.camStream.getTracks().forEach(track => track.stop())
				this.camStream = undefined
			} catch(e) {
				this.log(e)
			}
		},
		
		log (message) {
			this.$emit('log', message)
		}
  }
})
