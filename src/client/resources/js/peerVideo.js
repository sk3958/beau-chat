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
    <div class="peer-video-container">
			<video v-show="this.peerHasVideo" v-bind:id="peer_id" controls playsinline autoplay></video>
			<canvas v-show="!this.peerHasVideo" class="no_peer_camera"></canvas>
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
			peerHasVideo: false,
			peerCamStreamId: undefined,
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
				case 'videoInfo':
					this.peerHasVideo = data.hasVideo
					this.peerCamStreamId = data.streamId
					if (!this.peerHasVideo) this.drawNoCamera()
					this.sendVideoInfo(true)
					break
				case 'replyVideoInfo':
					this.peerHasVideo = data.hasVideo
					this.peerCamStreamId = data.streamId
					if (!this.peerHasVideo) this.drawNoCamera()
					this.createOffer()
					break
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

		drawNoCamera () {
			let canvas = this.peerVideo.parentElement.querySelector('.no_peer_camera')
			let ctx = canvas.getContext('2d')
			ctx.fillStyle = '#f1f1f1'
			ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
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
			if (this.camStream) {
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
				} else if (this.peerHasVideo && (undefined === this.peerVideo.srcObject || null === this.peerVideo.srcObject)) {
					this.peerVideo.srcObject = event.streams[0]
				} else {
					this.showMovieMusicPlayer(event.streams[0])
				}
			}

			if (this.offer) {
				this.dataChannel = this.pc.createDataChannel('DataChnnel')
				this.dataChannel.binaryType = 'arraybuffer'
				this.dataChannel.onmessage = this.onPeerMessage
				this.dataChannel.onopen = this.onDataChannelOpen
				this.sendVideoInfo(false)
			} else {
				this.pc.ondatachannel = (event) => {
					this.dataChannel = event.channel
					this.dataChannel.binaryType = 'arraybuffer'
					this.dataChannel.onmessage = this.onPeerMessage
				  this.dataChannel.onopen = this.onDataChannelOpen
				}
			}

			if (!this.offer) {
				this.sendDoneReadyForNewMember()
			}
		},

		sendVideoInfo (isReply) {
			let data = {
				message : isReply ? 'replyVideoInfo' : 'videoInfo',
				hasVideo: this.has_video,
				streamId: this.has_video ? this.camStream.id : 'none',
				from: this.my_id,
				to: this.peer_id
			}
			this.sendSignalingData(data)
		},

		async createOffer () {
			let option = {
				offerToReceiveAudio: true,
				offerToReceiveVideo: true
			}

			try {
				let desc = await this.pc.createOffer(option)
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

		onDataChannelOpen () {
		},

		onPeerMessage (event) {
			try {
				let message = JSON.parse(event.data)
				if ('message' === message.type) this.changeProp('recvMessage', message)
				else if ('file' === message.type) this.prepareRecvFile(message)
				else if ('info' === message.type) this.onPeerInfo(message)
			} catch (e) {
				this.recvFile(event.data)
			}
		},

		onPeerInfo (info) {
		},

		sendMessageToPeer (message) {
			this.dataChannel.send(JSON.stringify(message))
		},

    sendFileInfoToPeer (name, size) {
			let message = {}
			message.type = 'file'
      message.message = 'fileSend'
			message.filename = name
			message.filesize = size
			this.dataChannel.send(JSON.stringify(message))
    },
    
    sendFileTransferError (name) {
			let message = {}
			message.type = 'file'
      message.message = 'fileSendError'
			message.filename = name
			this.dataChannel.send(JSON.stringify(message))
    },
    
		sendFileToPeer (file) {
			this.makeSendProgress(file)
			let fileReader = new FileReader()
			const chunkSize = 16384;
			let offset = 0
      this.sendFileInfoToPeer(file.name, file.size)

			fileReader.addEventListener('error', () => this.showMessage('fileSend', 'Error', 'Error reading file'))
			fileReader.addEventListener('abort', () => this.showMessage('fileSend', 'Error', 'File reading aborted:'))
			fileReader.addEventListener('load', (event) => {
        try {
          if (this.dataChannel.bufferedAmount < this.pc.sctp.maxMessageSize) {
					  this.dataChannel.send(event.target.result)
					  offset += event.target.result.byteLength
          }
        } catch(e) {
          console.log(e)
					this.clearSendProgress()
					let info = {}
					info.from = this.my_id
					info.message = `Failed to send ${file.name} to ${this.peer_id}`
					this.changeProp('recvMessage', info)
          this.sendFileTransferError (file.name)
        }

				this.sendProgress.value = offset
				if (offset < file.size) {
					readSlice()
				} else {
					this.clearSendProgress()
					let info = {}
					info.from = this.my_id
					info.message = `Sent ${file.name} to ${this.peer_id}`
					this.changeProp('recvMessage', info)
				}
			})
	
			const readSlice = () => {
				const slice = file.slice(offset, offset + chunkSize);
				fileReader.readAsArrayBuffer(slice);
			}

			readSlice(0)
		},

		prepareRecvFile (message) {
      if ('fileSend' === message.message) {
				this.filename = message.filename
				this.filesize = message.filesize
				this.recvSize = 0
				this.recvBuffer = []

				let info = {}
				info.from = this.my_id
				info.message = `Receiving ${this.filename}(${this.filesize}) from ${this.peer_id}`
				this.changeProp('recvMessage', info)
				this.makeRecvProgress(this.filename, this.filesize)
				this.clearDownloadAnchor()
      } else if ('fileSendError' === message.message) {
				let info = {}
				info.from = this.my_id
				info.message = `Fail to receive ${this.filename} from ${this.peer_id}`
				this.clearRecvProgress()
				this.changeProp('recvMessage', info)
      }
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

				let info = {}
				info.from = this.my_id
				info.message = `Received ${this.filename} from ${this.peer_id}`
				this.changeProp('recvMessage', info)
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
			let p = document.createElement('p')
			p.appendChild(document.createTextNode(`sending ${file.name} to ${this.peer_id}`))
			this.sendProgressDiv.appendChild(p)
			this.sendProgress = document.createElement('progress')
			this.sendProgress.max = file.size
			this.sendProgress.value = '0'
			this.sendProgressDiv.appendChild(this.sendProgress)
			let parent = document.getElementById('share_text')
			parent.appendChild(this.sendProgressDiv)
			this.sendProgressDiv.classList.toggle('progress')
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
			let p = document.createElement('p')
			p.appendChild(document.createTextNode(`receiving ${filename} from ${this.peer_id}`))
			this.recvProgressDiv.appendChild(p)
			this.recvProgress = document.createElement('progress')
			this.recvProgress.max = filesize
			this.recvProgress.value = 0
			this.recvProgressDiv.appendChild(this.recvProgress)
			let parent = document.getElementById('share_text')
			parent.appendChild(this.recvProgressDiv)
			this.recvProgressDiv.classList.toggle('progress')
		}
  }
})
