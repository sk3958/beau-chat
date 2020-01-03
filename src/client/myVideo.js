Vue.component('my-video', {
  template: `
    <div id="video">
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
			stream: undefined 
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
			if (navigator.getUserMedia && navigator.appVersion.indexOf('SamsungBrowser') >= 0) {
				navigator.mediaDevices.getUserMedia({ video: true, audio: true })
					.then((stream) => {
						/*this.myVodeo.srcObject = stream */
						//document.getElementById('myVideo').srcObject = stream
						this.stream = stream
						this.$emit('video_info', true, this.stream)
					})
					.catch((err) => {
						this.myVideo.autoplay = false
						this.myVideo.loop = true
						this.myVideo.src = './chrome.mp4'
						var fps = 0
						this.stream = this.myVideo.captureStream(fps)
console.log(this.stream)
						this.$emit('video_info', true, this.stream)
						// this.$emit('video_info', false)
					})
			} else {
					this.myVideo.autoplay = false
					this.myVideo.loop = true
					this.myVideo.src = './chrome.mp4'
					var fps = 0
					this.stream = this.myVideo.captureStream(fps)
					this.$emit('video_info', true, this.stream)
				// this.$emit('video_info', false)
			}
		},

		start () {
			try {
				if (this.myVideo.src === '') this.myVideo.srcObject = this.stream
				this.myVideo.play()
			} catch(e) {
				window.alert(e)
			}
		},

		stop () {
			try {
				this.myVideo.pause()
			} catch(e) {
				window.alert(e)
			}
		}
  }
})
