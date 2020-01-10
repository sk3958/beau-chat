Vue.component('shares', {
  template: `
    <div id="shares">
			<div class="control-panel">
				<button type="button" class="icon-btn" v-on:click="this.openFileSelector">Open</button>
				<button type="button" class="icon-btn" v-on:click="this.broadcastMedia">Share</button>
				<span id="file_name">{{ this.fileName }}</span>
				<input type="file" id="stream_file" v-on:change="this.openFile">
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
				<div id="share_text">
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
				this.shareVideo = document.getElementById('share_video')
			}
			if (undefined === this.shareAudio) {
				this.shareAudio = document.getElementById('share_audio')
			}
			if (undefined === this.shareText) {
				this.shareText = document.getElementById('share_text')
			}
			if (undefined === this.shareVideoDiv) {
				this.shareVideoDiv = document.getElementById('share_video_div')
				this.shareVideoDiv.style.display = 'none'
			}
			if (undefined === this.shareAudioDiv) {
				this.shareAudioDiv = document.getElementById('share_audio_div')
				this.shareAudioDiv.style.display = 'none'
			}
			if (undefined === this.shareTextDiv) {
				this.shareTextDiv = document.getElementById('share_text_div')
				this.shareTextDiv.style.display = 'none'
			}

			this.fileName = ''
			this.fileOpener.value = ''
		},

		stop () {
			try {
				if ('' !== this.shareVideo.src) {
					this.shareVideo.pause()
					this.shareVideo.src = ''
				}

				this.srcStream = undefined
				this.$emit('change_prop', 'shareStream', this.srcStream)
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
			let canPlay = this.shareVideo.canPlayType(type)

			if ('no' === canPlay || '' === canPlay) {
				this.$emit('show_message', 'shareVideo', 'Notificationo', 'Not supported file type.')
				return false
			}

			let URL = window.URL || window.webkitURL
			let fileUrl = URL.createObjectURL(file)
			this.shareVideo.src = fileUrl

			this.shareVideoDiv.style.display = 'block'

			this.srcStream = this.shareVideo.captureStream()
			this.$emit('change_prop', 'shareStream', this.srcStream)
			return true
		},

		broadcastMedia () {
		},

		log (message) {
			this.$emit('log', message)
		}
  }
})
