Vue.component('shares', {
  template: `
    <div id="shares">
			<div class="control-panel">
				<button v-show="this.shareState !== 'receiving'" type="button" class="icon-btn" v-on:click="openFileSelector">share</button>
				<!--<button type="button" class="icon-btn" v-on:click="broadcastMedia">Share</button>
				<button type="button" class="icon-btn" v-on:click="showChatBox">chat</button>-->
				<span id="file_name">{{ this.fileName }}</span>
				<input type="file" id="stream_file" accept="audio/*|video/*" v-on:change="openFile">
			</div>
			<div id="share_text_div">
				<div id="share_text">
					<div class="message" v-for="(message, index) in messages" :key="index">
						<div v-if="message.type === 'info'">
							<div class="my-name"><div class="name">infomation</div></div>
							<div class="my-message"><div class="my-talk">{{ message.message }}</div></div>
						</div>
						<div v-else-if="message.from === my_id">
							<div class="my-name"><div class="name">me</div></div>
							<div class="my-message"><div class="my-talk">{{ message.message }}</div></div>
						</div>
						<div v-else>
							<div class="peer-name"><div class="name">{{ message.from }}</div></div>
							<div class="peer-message"><div class="peer-talk">{{ message.message }}</div></div>
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
			<div id="share_video_div">
				<div class="drag-target">
				  <button v-on:click="closeShareDiv(1)">X</button>
				</div>
				<video id="share_video" controls playsinline autoplay>
					This browser does not support video tag.
				</video>
			</div>
			<div id="share_audio_div">
				<div class="drag-target">
				  <button v-on:click="closeShareDiv(2)">X</button>
				</div>
				<audio id="share_audio" controls playsinline>
				</audio>
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
			shareState: '',
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
			observer: undefined,
			dragTarget: undefined,
			xEventPos: 0,
			yEventPos: 0
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

	mounted () {
		this.fileOpener = document.getElementById('stream_file')
		this.shareVideo = document.getElementById('share_video')
		this.shareAudio = document.getElementById('share_audio')
		this.shareText = document.getElementById('share_text')
		this.shareVideoDiv = document.getElementById('share_video_div')
		this.shareVideoDiv.style.display = 'none'
		this.shareAudioDiv = document.getElementById('share_audio_div')
		this.shareAudioDiv.style.display = 'none'
		this.shareTextDiv = document.getElementById('share_text_div')
		this.shareTextDiv.style.display = 'none'
		this.chatInput = document.getElementById('chat_input')
		this.sendFileSelector = document.getElementById('file_file')
		this.createObserver()
		this.setEvents()
		this.setVideoEvent()
	},

  beforeDestroy () {
		this.clear()
	},

  methods: {
		init () {
			this.fileName = ''
			this.fileOpener.value = ''
			this.showChatBox()
		},

		clear () {
			try {
				this.clearShareVideo()
				this.clearShareAudio()
				this.messages = []
			} catch(e) {
				this.log(e)
			}
		},

		clearShareVideo () {
			try {
				if ('' !== this.shareVideo.src) {
					this.shareVideo.pause()
					URL.revokeObjectURL(this.shareVideo.src)
					this.shareVideo.src = ''
				}

				if (undefined !== this.srcStream)
				{
					this.srcStream.getTracks().forEach(track => track.stop())
				}
			} catch(e) {
				this.log(e.message || e.stack || e)
			}

			this.setShareState('')
			this.fileName = ''
			this.fileOpener.value = ''
			this.shareVideoDiv.style.display = 'none'
			this.srcStream = undefined
			this.$emit('change_prop', 'shareStream', this.srcStream)
		},

		clearShareAudio () {
			if ('' !== this.shareAudio.src) {
				this.shareAudio.pause()
				URL.revokeObjectURL(this.shareAudio.src)
				this.shareAudio.src = ''
			}

			this.setShareState('')
			this.fileName = ''
			this.fileOpener.value = ''
			this.shareAudioDiv.style.display = 'none'
			this.srcStream = undefined
			this.$emit('change_prop', 'shareStream', this.srcStream)
		},

		setShareState (state) {
			if (state === this.shareState) return

			this.shareState = state
		},

		openFileSelector () {
			this.fileOpener.click()
		},

		openFile () {
			if ('' === this.fileOpener.value) return

			let file = this.fileOpener.files[0]
			let type = file.type
			let canPlay = this.shareVideo.canPlayType(type)

			if ('no' === canPlay || '' === canPlay) {
				this.$emit('show_message', 'shareVideo', 'Notificationo', 'Not supported file type.')
				return false
			}

			this.setShareState('sending')
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
			message.type = 'info'
			message.from = this.my_id
			message.message = `sending file ${file.name}(size: ${file.size})`
			this.messages.push(message)
			this.messageCount = this.messages.length
			this.$emit('change_prop', 'fileToSend', file)
		},

		showChatBox () {
			this.shareTextDiv.style.display = 'block'
			//this.chatInput.focus()
		},

		createObserver () {
			this.observer = new MutationObserver(this.scrollToBottom)
			this.observer.observe(this.shareText, { childList: true })
		},

		scrollToBottom () {
			this.shareText.scrollTop = this.shareText.scrollHeight
		},

		setEvents () {
      const onMouseDown = (e) => {
				if (undefined !== this.dragTarget &&
					this.dragTarget instanceof HTMLDivElement &&
					0 === this.dragTarget.id.indexOf('share_')) return

				this.dragTarget = e.target.parentElement
				this.xEventPos = e.clientX
				this.yEventPos = e.clientY
			}

			const onMouseMove = (e) => {
				if (undefined === this.dragTarget) return

				e.preventDefault()
				let curLeft = this.dragTarget.offsetLeft
				let curTop = this.dragTarget.offsetTop
				let gapX = e.clientX - this.xEventPos
				let gapY = e.clientY - this.yEventPos
				this.dragTarget.style.left = (curLeft + gapX) + 'px'
				this.dragTarget.style.top = (curTop + gapY) + 'px'
				this.xEventPos = e.clientX
				this.yEventPos = e.clientY
			}

			const onMouseUp = (e) => {
				this.dragTarget = undefined
				this.xEventPos = 0
				this.yEventPos = 0
			}

			const onTouchStart = (e) => {
				if (undefined !== this.dragTarget &&
					this.dragTarget instanceof HTMLDivElement &&
					0 === this.dragTarget.id.indexOf('share_')) return

				this.dragTarget = e.targetTouches[0].target
				this.dragTarget = this.dragTarget.parentElement

				let point = e.targetTouches[0]
				let x = Math.round(point.pageX)
				let y = Math.round(point.pageY)
				this.xEventPos = x
				this.yEventPos = y
			}

			const onTouchMove = (e) => {
				if (undefined === this.dragTarget) return

				e.preventDefault()
				let point = e.targetTouches[0]
				let x = Math.round(point.pageX)
				let y = Math.round(point.pageY)
				let curLeft = this.dragTarget.offsetLeft
				let curTop = this.dragTarget.offsetTop
				let gapX = x - this.xEventPos
				let gapY = y - this.yEventPos

				this.dragTarget.style.left = (curLeft + gapX) + 'px'
				this.dragTarget.style.top = (curTop + gapY) + 'px'
				this.xEventPos = x
				this.yEventPos = y
			}

			const onTouchEnd = (e) => {
				this.dragTarget = undefined
				this.xEventPos = 0
				this.yEventPos = 0
			}

			const onTouchCancel = (e) => {
				this.dragTarget = undefined
				this.xEventPos = 0
				this.yEventPos = 0
			}

			let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

			let el = this.shareVideoDiv.querySelector('.drag-target')
			el.addEventListener('mousedown', onMouseDown)
			document.body.addEventListener('mousemove', onMouseMove)
			document.body.addEventListener('mouseup', onMouseUp)
			if (isMobile) {
				el.addEventListener('touchstart', onTouchStart)
				el.addEventListener('touchmove', onTouchMove)
				el.addEventListener('touchend', onTouchEnd)
				el.addEventListener('touchcancel', onTouchCancel)
			}

			el = this.shareAudioDiv.querySelector('.drag-target')
			el.addEventListener('mousedown', onMouseDown)
			document.body.addEventListener('mousemove', onMouseMove)
			document.body.addEventListener('mouseup', onMouseUp)
			if (isMobile) {
				el.addEventListener('touchstart', onTouchStart)
				el.addEventListener('touchmove', onTouchMove)
				el.addEventListener('touchend', onTouchEnd)
				el.addEventListener('touchcancel', onTouchCancel)
			}
		},

		closeShareDiv (target) {
			if (1 === target) this.clearShareVideo()
			else if (2 === target) this.clearShareAudio()
		},

		setVideoEvent () {
			video = this.shareVideo
			video.addEventListener('loadedmetadata', (event) => {
				let width = video.videoWidth
				let height = video.videoHeight

				if (0 < width && 0 < height) {
					video.style.width = width + 'px'
					video.style.height = height + 'px'
				}
			})

			/*video.addEventListener('ended', () => {
				this.clearShareVideo()
			})*/

			/*video.addEventListener('play', () => {
				if (undefined === this.srcStream) this.broadcastMedia()
			})*/

			video.addEventListener('playing', () => {
				if ('sending' !== this.shareState) this.setShareState('receiving')

				if ('sending' === this.shareState) this.broadcastMedia()
			})

		},

		log (message) {
			this.$emit('log', message)
		}
  }
})
