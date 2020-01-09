Vue.component('my-video', {
  template: `
    <div id="my_videos">
			<div class="control-panel">
				<button type="button" class="icon-btn" v-on:click="this.openFileSelector">Open</button>
				<button type="button" class="icon-btn" v-on:click="this.broadcastMedia">Start</button>
				<span id="file_name">{{ this.fileName }}</span>
				<input type="file" id="stream_file" v-model="fileName">
			</div>
		  <div id="my_camera">
				<video id="myVideo" controls playsinline muted>
					You have no camera or this browser does not support video tag.
				</video>
			</div>
			<div id="my_media">
				<video id="myFileVideo" controls playsinline>
					This browser does not support video tag.
			  </video>
			</div>
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
			camStream: undefined,
			srcStream: undefined,
			fileName: '',
			fileOpener: undefined,
			fileVideo: undefined,
			fileaVideoDiv: undefined
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
		this.getVideoStream()
	},

  beforeDestroy () {
		this.stop()
	},

  methods: {
		getVideoStream () {
			const constraints = {
				video: {
					width: 480,
					height: 360,
					frameRate: 20
				},
				audio: {
					channelCount: 1
				}
			}

			if (navigator.getUserMedia && navigator.appVersion.indexOf('SamsungBrowser') <= 0) {
				navigator.mediaDevices.getUserMedia(constraints)
					.then((stream) => {
						this.camStream = stream
						this.$emit('video_info', true, this.camStream, true)
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
			}
		},

		start () {
			if (undefined === this.fileOpener) {
				this.fileOpener = document.getElementById('stream_file')
			}
			if (undefined === this.fileVideo) {
				this.fileVideo = document.getElementById('myFileVideo')
			}
			if (undefined === this.fileVideoDiv) {
				this.fileVideoDiv = document.getElementById('my_media')
			}
			this.fileName = ''
			this.fileOpener.value = ''
			this.fileVideoDiv.style.display = 'none'

			try {
				if ('' === this.myVideo.src) this.myVideo.srcObject = this.camStream
				this.myVideo.play()
			} catch(e) {
				this.log(e.message || e)
			}
		},

		stop () {
			try {
				this.myVideo.pause()
				if ('' === this.myVideo.src) this.myVideo.srcObject = undefined
			} catch(e) {
				window.alert(e)
			}
		},

		openFileSelector () {
			this.fileOpener.click()
		},

		broadcastMedia () {
			let file = this.fileOpener.files[0]
			let type = file.type
			let canPlay = this.fileVideo.canPlayType(type)

			if ('no' === canPlay) {
				this.$emit('show_message', 'fileVideo', 'Notificationo', 'Not supported file type.')
				return false
			}

			let URL = window.URL || window.webkitURL
			let fileUrl = URL.createObjectURL(file)
			this.fileVideo.src = fileUrl

			this.fileVideoDiv.style.display = 'block'

			this.srcStream = this.fileVideo.captureStream()
			this.$emit('video_info', true, this.camStream, false)
			return true
		},

		log (message) {
			this.$emit('log', message)
		}
  }
})
