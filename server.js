let express = require('express')
let app = express()
let https = require('https')
let fs = require('fs')

let options = {
  key: fs.readFileSync('./keys/private_key.pem'),
  cert: fs.readFileSync('./keys/beauedu.crt')
}

app.use(express.static(__dirname + '/src/client'))
let server = https.createServer(options, app)
let io = require('socket.io')(server)
let wildcard = require('socketio-wildcard')()
io.use(wildcard)

app.get('/', (req, res) => {
  // need check user using redis
  res.sendFile(__dirname + '/src/client/chat.html')
})
server.listen(3002, () => {
  console.log('Listening on port 3002')
})

io.on('connection', (socket) => {
  socket.on('*', (packet) => {
    require('./src/processRequest')(
      io,
      socket,
      packet.data[0],
      packet.data[1] ? JSON.parse(packet.data[1]) : null
    )
  })
})

process.on('uncaughtException', (error) => {
  console.log(error.stack);
})
