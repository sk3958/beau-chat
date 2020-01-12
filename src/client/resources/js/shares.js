Vue.component('shares', {
  template: `
    <div id="shares">
			<div class="control-panel">
				<button type="button" class="icon-btn" v-on:click="openFileSelector">Open</button>
				<button type="button" class="icon-btn" v-on:click="broadcastMedia">Share</button>
				<button type="button" class="icon-btn" v-on:click="showChatBox">chat</button>
				<span id="file_name">{{ this.fileName }}</span>
				<input type="file" id="stream_file" accept="audio/*|video/*" v-on:change="openFile">
			</div>
			<div id="share_video_div">
				<video id="share_video" controls playsinline autoplay>
					This browser does not support video tag.
        </video>
			</div>
			<div id="share_audio_div">
				<audio id="share_audio" controls playsinline>
        </audio>
			</div>
			<div id="share_text_div">
				<div id="share_text">
					<div class="message" v-for="(message, index) in messages" :key="index">
						<div v-if="message.from === my_id">
							<div class="my-name"><div class="name">me</div></div><br>
							<div class="my-message"><div class="my-talk">{{ message.message }}</div></div>
						</div>
						<div v-if="message.from !== my_id">
							<div class="peer-name"><div class="name">me</div></div><br>
							<div class="peer-message"><div class="peer-talk">{{ message.message }}</div></div>
						</div>
							<p><span class="name">{{ message.from }}</span></p>
							<p><span class="peer-talk">{{ message.message }}</span></p>
						</div>
					</div>
					<div class="dummy">
						{{ messageCount }}
					</div>
				</div>
				<div id="message_box">
					<input id="chat_input" type="text" v-on:keyup.enter="sendMessage">
					<button id="send" type="button" v-on:click="sendMessage">send</button>
					<button id="file" type="button" v-on:click="openSendFileSelector">file</button>
					<input type="file" id="file_file" v-on:change="sendFile">
				</div>
			</div>
    </div>
  `,

  props: {
		my_id: String,
		is_room: Boolean,
		share_stream: MediaStream,
		recv_message: Object
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
			shareTextDiv: undefined,
			chatInput: undefined,
			messages: [],
			messageCount: 0,
			sendFileSelector: undefined,
			observer: undefined
    }
  },

	watch: {
		is_room (value) {
			if (value) this.init()
			else this.clear()
		},

		fileName (value) {
			if ('' !== value) this.openFile()
		},

		recv_message (value) {
			this.messages.push(value)
			this.showChatBox()
			this.messageCount = this.messages.length
		}
	},

  beforeDestroy () {
		this.clear()
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
			if (undefined === this.chatInput) {
				this.chatInput = document.getElementById('chat_input')
			}
			if (undefined === this.sendFileSelector) {
				this.sendFileSelector = document.getElementById('file_file')
			}
			if (undefined === this.observer) this.createObserver()

			this.fileName = ''
			this.fileOpener.value = ''
			this.showChatBox()
		},

		clear () {
			try {
				if ('' !== this.shareVideo.src) {
					this.shareVideo.pause()
					this.shareVideo.src = ''
				}
				if ('' !== this.shareAudio.src) {
					this.shareAudio.pause()
					this.shareAudio.src = ''
				}

				this.messages = []

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

			return true
		},

		broadcastMedia () {
			this.srcStream = this.shareVideo.captureStream()
			this.$emit('change_prop', 'shareStream', this.srcStream)
		},

		sendMessage () {
			if ('' === this.chatInput.value) return

			let message = {}
			message.type = 'message'
			message.from = this.my_id
			message.message = this.chatInput.value
			this.messages.push(message)
			this.$emit('change_prop', 'messageToSend', message)
			this.chatInput.value = ''
			this.chatInput.focus()
		},

		openSendFileSelector () {
			this.sendFileSelector.click()
		},

		sendFile () {
			if ('' === this.sendFileSelector.value) return

			let file = this.sendFileSelector.files[0]
			let message = {}
			message.type = 'message'
			message.from = 'me'
			this.messages.push(message)
			message.message = `sending file ${file.name}(size: ${file.size})`
			this.$emit('change_prop', 'messageToSend', message)
			this.$emit('change_prop', 'fileToSend', file)
		},

		showChatBox () {
			this.shareTextDiv.style.display = 'block'
			this.chatInput.focus()
		},

		createObserver () {
			this.observer = new MutationObserver(this.scrollToBottom)
			this.observer.observe(this.shareText, { childList: true })
		},

		scrollToBottom () {
			this.shareText.scrollTop = this.shareText.scrollHeight
		},

		log (message) {
			this.$emit('log', message)
		}
  }
})
