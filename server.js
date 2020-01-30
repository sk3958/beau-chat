const express = require('express')
const app = express()
const https = require('https')
const fs = require('fs')
const ejs = require('ejs')
const uuid = require('uuid/v4')
const session = require('express-session')
const redis = require('redis')
const redisStore = require('connect-redis')(session)
const checkUser = require('./src/checkUser')

const redisClient = redis.createClient()
redisClient.on('error', (err) => {
  console.log('Redis error : ', err)
})

let options = {
  key: fs.readFileSync('./keys/private_key.pem'),
  cert: fs.readFileSync('./keys/beauedu.crt')
}

app.set('views', __dirname + '/src/client')
app.set('view engine', 'ejs')
app.engine('html', ejs.renderFile)
app.use(express.static(__dirname + '/src/client/resources'))
app.use(session({
  genid: (req) => {
    return uuid()
  },
  store: new redisStore({ host: 'localhost', port: process.env.REDIS_PORT || 6379, client: redisClient }),
  secret: process.env['SESSION_SECRET'],
  resave: false,
  cookie: { maxAge: 0.1 * 60 * 60 * 1000 },
  saveUninitialized: true
}))

let server = https.createServer(options, app)
let io = require('socket.io')(server)
let wildcard = require('socketio-wildcard')()
io.use(wildcard)

app.get('/', (req, res) => {
  checkUser(req, res, true)
})
app.get('/classroom', (req, res) => {
  checkUser(req, res, false)
})
server.listen(3002, () => {
  console.log('Listening on port 3002')
})

const processMessage = require('./src/processRequest')
io.on('connection', (socket) => {
	socket.on('disconnect', () => {
		processMessage(io, socket, 'disconnect', null)
	})
	socket.on('error', () => {
		processMessage(io, socket, 'error', null)
	})
  socket.on('*', (packet) => {
    processMessage(
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
