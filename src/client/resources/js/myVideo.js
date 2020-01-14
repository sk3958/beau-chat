Vue.component('my-video', {
  template: `
    <div id="my_video">
			<video id="myVideo" controls playsinline muted>
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
			myVideo: undefined,
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
		// this.getVideoStream()
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
						this.$emit('video_info', true, this.camStream, true)
						callback()
					})
					.catch((err) => {
						this.log(err)
						this.myVideo.autoplay = false
						this.myVideo.loop = true
						this.myVideo.src = './chrome.mp4'
						var fps = 0
						this.camStream = this.myVideo.captureStream(fps)
						this.$emit('video_info', true, this.camStream, true)
						// this.$emit('video_info', false, undefined, true)
						callback()
					})
			} else {
				this.log('navigator.getUserMedia failed')
				this.myVideo.autoplay = false
				this.myVideo.loop = true
				this.myVideo.src = './chrome.mp4'
				var fps = 0
				this.camStream = this.myVideo.captureStream(fps)
				this.$emit('video_info', true, this.camStream, true)
				// this.$emit('video_info', false, undefined, true)
				callback()
			}
		},

		start () {
			this.getVideoStream(() => {
				try {
					if ('' === this.myVideo.src) this.myVideo.srcObject = this.camStream
					this.myVideo.play()
				} catch(e) {
					this.log(e.message || e)
				}
			})
			/*try {
				if ('' === this.myVideo.src) this.myVideo.srcObject = this.camStream
				this.myVideo.play()
			} catch(e) {
				this.log(e.message || e)
			}*/
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
