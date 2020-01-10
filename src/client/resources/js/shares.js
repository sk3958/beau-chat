Vue.component('shares', {
  template: `
    <div id="shares">
			<div class="control-panel">
				<button type="button" class="icon-btn" v-on:click="this.openFileSelector">Open</button>
				<button type="button" class="icon-btn" v-on:click="this.broadcastMedia">Share</button>
				<span id="file_name">{{ this.fileName }}</span>
				<input type="file" id="stream_file" v-model="fileName">
			</div>
			<div id="share_video_div">
				<video id="share_video" controls playsinline>
					This browser does not support video tag.
			  </video>
			</div>
			<div id="share_audio_div">
				<audio id="share_audio" controls playsinline>
			  </audio>
			</div>
			<div id="share_text_div">
				<div id="shareText">
			  </div>
			</div>
    </div>
  `,

  props: {
		is_room: Boolean,
		shareStream: MediaStream,
		recvMessage: String,
		sendMessage: String
  },

  data: function () {
    return {
			srcStream: undefined,
			fileName: '',
			fileOpener: undefined,
			shares: undefined,
			shareVideo: undefined,
			shareVideoDiv: undefined,
			shareAudio: undefined,
			shareAudioDiv: undefined,
			shareText: undefined,
			shareTextDiv: undefined
    }
  },

	watch: {
		is_room (value) {
			if (value) this.init()
			else this.stop()
		},

		fileName (value) {
			if ('' !== value) this.openFile()
		}
	},

  beforeDestroy () {
		this.stop()
	},

  methods: {
		init () {
			if (undefined === this.fileOpener) {
				this.fileOpener = document.getElementById('stream_file')
			}
			if (undefined === this.shareVideo) {
				this.fileVideo = document.getElementById('myFileVideo')
			}
			if (undefined === this.fileVideoDiv) {
				this.fileVideoDiv = document.getElementById('my_media')
			}
			this.fileName = ''
			this.fileOpener.value = ''
			this.fileVideoDiv.style.display = 'none'
		},

		stop () {
			try {
				if ('' !== this.fileVideo.src) {
					this.fileVideo.pause()
					this.fileVideo.src = ''
				}

				this.srcStream = undefined
			} catch(e) {
				this.log(e)
			}
		},

		openFileSelector () {
			this.fileOpener.click()
		},

		openFile () {
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
			return true
		},

		broadcastMedia () {
		},

		log (message) {
			this.$emit('log', message)
		}
  }
})
