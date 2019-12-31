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
    <div>
			<video v-bind:id="peer_id" playsinline autoplay></video>
    </div>
  `,

  props: {
		socket: Object,
		my_id: String,
		peer_id: String,
		peer_name: String,
		stream: Object,
		offer: Boolean,
		has_video: Boolean
  },

  data: function () {
    return {
			sendPC: undefined,
			recvPC: undefined,
			peerVideo: undefined,
			sendDataChannel: undefined,
			recvDataChannel: undefined,
			offerOptions: { offerToReceiveAudio: 1, offerToReceiveVideo: 1 }
    }
  },

	watch: {
	},

	mounted () {
	},

  beforeDestroy () {
		this.sendPC.close()
		this.recvPC.close()
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

		async sendOffer () {
			try {
				let desc = await this.sendPC.createOffer(this.offerOptions)
				await this.sendPC.setLocalDescription(desc)
				let data = {
					message : 'offer',
					desc: desc,
					from: this.my_id,
					to: this.peer_id
				}
				this.sendSignalingData(data)
			} catch (e) {
			}
		},

		createPC () {
			if (undefined === this.sendPC) this.sendPC = new RTCPeerConnection(pcConfig)
			this.sendDataChannel = this.sendPC.createDataChannel('DataChnnel')
			if (this.has_video) {
				this.stream.forEach(track => this.sendPC.addTrack(track, this.stream))
			}

			if (undefined === this.recvPC) this.recvPC = new RTCPeerConnection(pcConfig)

			this.sendPC.onicecandidate = (event) => {
				if (!event.candidate) return
				let data = {
					message: 'iceCandidate',
					origin: 'offer',
					desc: event.candidate,
					from: this.my_id,
					to: this.peer_id
				}
				this.sendSignalingData(data)
			}
			this.recvPC.onicecandidate = (event) => {
				if (!event.candidate) return
				let data = {
					message: 'iceCandidate',
					origin: 'answer',
					desc: event.candidate,
					from: this.my_id,
					to: this.peer_id
				}
				this.sendSignalingData(data)
			}

			this.sendPC.onconnectionstatechange = (event) => {
				console.log('sendPC state')
				console.log(event)
			}
			this.recvPC.onconnectionstatechange = (event) => {
				console.log('recvPC state')
				console.log(event)
			}

			this.recvPC.ontrack = (event) => {
console.log(event)
				if (this.peerVideo.srcObject !== event.streams[0]) {
					this.peerVideo.srcObject = event.streams[0]
				}
			}
			this.recvPC.ondatachannel = (event) => {
				this.recvDataChannel = event.channel
				this.recvDataChannel.onmessage = (event) => {
					console.log('Receive Data from ' + this.peer_id + ' = ' + event.data)
				}
setTimeout(() => {
	this.sendDataChannel.send('Hello I am ' + this.my_id)
}, 1000)
console.log(this.recvDataChannel)
			}

			if (this.offer) this.sendOffer()
		},

		async createAnswer(data) {
			try {
				await this.recvPC.setRemoteDescription(new RTCSessionDescription(data.desc))
				let desc = await this.recvPC.createAnswer()
				await this.recvPC.setLocalDescription(desc)
				let answer = {
					message: 'answer',
					desc: desc,
					from: this.my_id,
					to: this.peer_id
				}
				this.sendSignalingData(answer)

				this.sendOffer()
			} catch(e) {
console.log(e)
			}
		},

		async acceptAnswer (data) {
			await this.sendPC.setRemoteDescription(new RTCSessionDescription(data.desc))
		},

		async addIceCandidate (data) {
			try {
				if (data.origin === 'offer') await this.recvPC.addIceCandidate(new RTCIceCandidate(data.desc))
				else await this.sendPC.addIceCandidate(new RTCIceCandidate(data.desc))
			} catch(e) {
			}
		}
  }
})
