const pcConfig = {
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
    <div class="video-container">
			<video v-bind:id="peer_id" controls playsinline autoplay></video>
    </div>
  `,

  props: {
		socket: Object,
		my_id: String,
		peer_id: String,
		peer_name: String,
		stream: MediaStream,
		offer: Boolean,
		has_video: Boolean,
		log: Function
  },

  data: function () {
    return {
			pc: undefined,
			peerVideo: undefined,
			dataChannel: undefined
    }
  },

	watch: {
	},

	mounted () {
	},

  beforeDestroy () {
		this.pc.close()
		this.pc = undefined
	},

  methods: {
		initialize () {
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

		sendSignalingData (data) {
			this.socket.emit('pcSignaling', JSON.stringify(data))
		},

		async createPC () {
			if (undefined === this.pc) this.pc = new RTCPeerConnection(pcConfig)
			if (this.has_video) {
				this.stream.getTracks().forEach(track => this.pc.addTrack(track, this.stream))
				// this.pc.addTrack(this.stream.getVideoTracks()[0], this.stream)
				// this.pc.addTrack(this.stream.getAudioTracks()[0], this.stream)
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

			this.pc.onconnectionstatechange = (event) => {
			}

			this.pc.ontrack = (event) => {
				if (this.peerVideo.srcObject !== event.streams[0]) {
					this.peerVideo.srcObject = event.streams[0]
				}
			}

			if (this.offer) {
				this.dataChannel = this.pc.createDataChannel('DataChnnel')
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
			} else {
				this.pc.ondatachannel = (event) => {
					this.dataChannel = event.channel
					this.dataChannel.onmessage = (event) => {
						this.log('Receive Data from ' + this.peer_id + ' = ' + event.data)
					}
			}
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
		}
  }
})
