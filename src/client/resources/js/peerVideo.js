const pcConfig = {
	sdpSemantics: 'unified-plan',
	iceServers: [
		{
			urls: "stun:stun.stunprotocol.org"
		},
		{
			urls: "turn:13.250.13.83:3478?transport=udp",
			username: "YzYNCouZM1mhqhmseWk6",
			credential: "YzYNCouZM1mhqhmseWk6"
		},
		{
			urls: 'turn:numb.viagenie.ca',
			credential: 'muazkh',
			username: 'webrtc@live.com'
		},
		{
			urls: 'turn:192.158.29.39:3478?transport=udp',
			credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
			username: '28224511:1379330808'
		},
		{
			urls: 'turn:192.158.29.39:3478?transport=tcp',
			credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
			username: '28224511:1379330808'
		},
		{
			urls: 'turn:turn.bistri.com:80',
			credential: 'homeo',
			username: 'homeo'
		},
		{
			urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
			credential: 'webrtc',
			username: 'webrtc'
		}
	]
}

var PeerVideo = Vue.component('PeerVideo', {
  template: `
    <div class="peer_video-container">
			<video v-bind:id="peer_id" controls playsinline autoplay></video>
    </div>
  `,

  props: {
		socket: Object,
		my_id: String,
		peer_id: String,
		peer_name: String,
		camStream: MediaStream,
		shareStream: MediaStream,
		offer: Boolean,
		has_video: Boolean,
		messageToSend: Object,
		fileToSend: File
	},

  data: function () {
    return {
			pc: undefined,
			peerVideo: undefined,
			dataChannel: undefined,
			log: undefined,
			changeProp: undefined,
			showMessage: undefined,
			shareStreamSenders: [],
			shareOffer: false,
			sendProgressDiv: undefined,
			sendProgress: undefined,
			recvProgressDiv: undefined,
			recvProgress: undefined,
			recvBuffer: [],
			filename: '',
			filesize: 0,
			recvSize: 0,
			downloadAnchor: undefined
    }
  },

	watch: {
		shareStream (value) {
			this.addTrack(value)
		},

		messageToSend (value) {
			this.sendMessageToPeer(value)
		},

		fileToSend (value) {
			this.sendFileToPeer(value)
		}
	},

  methods: {
		initialize (log, changeProp, showMessage) {
			this.log = log
			this.changeProp = changeProp
			this.showMessage = showMessage
			this.peerVideo = document.getElementById(this.peer_id)
			this.socket.on('pcSignaling', (message) => {
				var data = JSON.parse(message)
				if (data.from === this.peer_id) {
					this.processSignaling(data)
				}
			})

			this.createPC()
		},

		processSignaling (data) {
			switch (data.message) {
				case 'offer':
					this.createAnswer(data)
					break
				case 'answer':
					this.acceptAnswer(data)
					break
				case 'iceCandidate':
					this.addIceCandidate(data)
					break
				default:
					break
			}
		},

		sendDoneReadyForNewMember () {
			this.socket.emit('doneReadyForNewMember',
				JSON.stringify({ from: this.my_id, to: this.peer_id }))
		},

		sendSignalingData (data) {
			this.socket.emit('pcSignaling', JSON.stringify(data))
		},

		async createPC () {
			if (undefined === this.pc) this.pc = new RTCPeerConnection(pcConfig)
			if (this.has_video) {
				this.camStream.getTracks().forEach(track => 
					this.pc.addTrack(track, this.camStream))
			}


			this.pc.onicecandidate = (event) => {
				if (!event.candidate) return
				let data = {
					message: 'iceCandidate',
					desc: event.candidate,
					from: this.my_id,
					to: this.peer_id
				}
				this.sendSignalingData(data)
			}

			this.pc.onconnectionstatechange = () => {
			}

			this.pc.onnegotiationneeded = () => {
				if (this.shareOffer) {
					this.createOffer()
					this.shareOffer = false
				}
			}

			this.pc.ontrack = (event) => {
				if (event.streams[0] === this.peerVideo.srcObject) {
					this.peerVideo.srcObject = event.streams[0]
				} else if (undefined === this.peerVideo.srcObject || null === this.peerVideo.srcObject) {
					this.peerVideo.srcObject = event.streams[0]
				} else {
					this.showMovieMusicPlayer(event.streams[0])
				}
			}

			if (this.offer) {
				this.dataChannel = this.pc.createDataChannel('DataChnnel')
				this.dataChannel.binaryType = 'arraybuffer'
				this.dataChannel.onmessage = this.onPeerMessage
				this.createOffer()
			} else {
				this.pc.ondatachannel = (event) => {
					this.dataChannel = event.channel
					this.dataChannel.binaryType = 'arraybuffer'
					this.dataChannel.onmessage = this.onPeerMessage
				}
			}

			if (!this.offer) this.sendDoneReadyForNewMember()
		},

		async createOffer () {
			try {
				let desc = await this.pc.createOffer()
				await this.pc.setLocalDescription(desc)
				let data = {
					message : 'offer',
					desc: desc,
					from: this.my_id,
					to: this.peer_id
				}
				this.sendSignalingData(data)
			} catch (e) {
				this.log(e)
			}
		},

		async createAnswer(data) {
			try {
				await this.pc.setRemoteDescription(new RTCSessionDescription(data.desc))
				let desc = await this.pc.createAnswer()
				await this.pc.setLocalDescription(desc)
				let answer = {
					message: 'answer',
					desc: desc,
					from: this.my_id,
					to: this.peer_id
				}
				this.sendSignalingData(answer)
			} catch(e) {
				this.log(e)
			}
		},

		async acceptAnswer (data) {
			await this.pc.setRemoteDescription(new RTCSessionDescription(data.desc))
		},

		async addIceCandidate (data) {
			try {
				await this.pc.addIceCandidate(new RTCIceCandidate(data.desc))
			} catch(e) {
				this.log(e)
			}
		},

		addTrack (stream) {
			if (!(stream instanceof MediaStream)) return false

			for (let i = this.shareStreamSenders.length - 1; i >= 0; i--) {
				this.pc.removeTrack(this.shareStreamSenders.pop())
			}

			stream.getTracks().forEach((track) => {
				let sender = this.pc.addTrack(track, stream)
				this.shareStreamSenders.push(sender)
			})

			this.shareOffer = true
		},

    showMovieMusicPlayer (stream) {
			let isVideo = stream.getVideoTracks().length > 0
			let player = container = undefined

			if (isVideo) {
				player = document.getElementById('share_video')
				container = document.getElementById('share_video_div')
			} else {
				player = document.getElementById('share_audio')
				container = document.getElementById('share_audio_div')
			}

			container.style.display = 'block'
			player.srcObject = stream

			player.play()
		},

		onPeerMessage (event) {
			try {
				let message = JSON.parse(event.data)
				if ('message' === message.type) this.changeProp('recvMessage', message)
				else if ('file' === message.type) this.prepareRecvFile(message)
			} catch (e) {
				this.recvFile(event.data)
			}
		},

		sendMessageToPeer (message) {
			message.from = this.my_id
			this.dataChannel.send(JSON.stringify(message))
		},

		sendFileToPeer (file) {
			this.makeSendProgress(file)
			let fileReader = new FileReader()
			const chunkSize = 16384;
			let offset = 0
			let message = {}
			message.type = 'file'
			message.filename = file.name
			message.filesize = file.size
			this.dataChannel.send(JSON.stringify(message))

			fileReader.addEventListener('error', () => this.showMessage('fileSend', 'Error', 'Error reading file'))
			fileReader.addEventListener('abort', () => this.showMessage('fileSend', 'Error', 'File reading aborted:'))
			fileReader.addEventListener('load', (event) => {
				this.dataChannel.send(event.target.result)
				offset += event.target.result.byteLength
				this.sendProgress.value = offset
				if (offset < file.size) readSlice()
				else this.clearSendProgress()
			})
	
			const readSlice = () => {
				const slice = file.slice(offset, offset + chunkSize);
				fileReader.readAsArrayBuffer(slice);
			}

			readSlice(0)
		},

		prepareRecvFile (message) {
			this.filename = message.filename
			this.filesize = message.filesize
			this.recvSize = 0
			this.recvBuffer = []
			this.makeRecvProgress(this.filename, this.filesize)
			this.clearDownloadAnchor()
		},

		recvFile (data) {
			this.recvBuffer.push(data)
			this.recvSize += data.byteLength
			this.recvProgress.value = this.recvSize

			if (this.recvSize === this.filesize) {
				this.clearRecvProgress()
				this.makeDownloadAnchor()

				const received = new Blob(this.recvBuffer)
				this.downloadAnchor.href = URL.createObjectURL(received)
				this.downloadAnchor.download = this.filename
				this.downloadAnchor.click()
				this.recvBuffer = []
			}
		},

		makeDownloadAnchor () {
			this.downloadAnchor = document.createElement('a')
			this.downloadAnchor.class = 'download'
			let parent = document.getElementById('shares')
			parent.appendChild(this.downloadAnchor)

		},

		clearDownloadAnchor () {
			if (this.downloadAnchor) {
				this.downloadAnchor.textContent = ''
				this.downloadAnchor.removeAttribute('download')
				if (this.downloadAnchor.href) {
					URL.revokeObjectURL(this.downloadAnchor.href)
					this.downloadAnchor.removeAttribute('href')
				}
				this.downloadAnchor.remove()
				this.downloadAnchor = undefined
			}
		},

		makeSendProgress (file) {
			this.sendProgressDiv = document.createElement('div')
			this.sendProgressDiv.class = 'progress'
			let p = document.createElement('p')
			p.appendChild(document.createTextNode(`sending ${file.name}`))
			this.sendProgressDiv.appendChild(p)
			this.sendProgress = document.createElement('progress')
			this.sendProgress.max = file.size
			this.sendProgress.value = '0'
			this.sendProgressDiv.appendChild(this.sendProgress)
			let parent = document.getElementById('shares')
			parent.appendChild(this.sendProgressDiv)
		},

		clearSendProgress () {
			this.sendProgressDiv.remove()
			this.sendProgressDiv = undefined
			this.sendProgress = undefined
		},

		clearRecvProgress () {
			this.recvProgressDiv.remove()
			this.recvProgressDiv = undefined
			this.recvProgress = undefined
		},

		makeRecvProgress (filename, filesize) {
			this.recvProgressDiv = document.createElement('div')
			this.recvProgressDiv.class = 'progress'
			let p = document.createElement('p')
			p.appendChild(document.createTextNode(`receiving ${filename}`))
			this.recvProgressDiv.appendChild(p)
			this.recvProgress = document.createElement('progress')
			this.recvProgress.max = filesize
			this.recvProgress.value = 0
			this.recvProgressDiv.appendChild(this.recvProgress)
			let parent = document.getElementById('shares')
			parent.appendChild(this.recvProgressDiv)
		}
  }
})
