const redis = require('redis')

async function setUser (req, res) {
  let session = req.session
  if (session.logined) {
    res.sendFile(__dirname + '/client/chat.html')
    return true
  }

  const redisClient = redis.createClient(process.env.REDIS_PORT || 6379)
  try {
    const { user_id, tempKey } = req.params
    if (undefined === user_id || undefined === tempKey) {
      res.sendStatus(404)
      return false
    }

    const info = await redisClient.get(user_id)
    const userInfo = JSON.parse(info)
    if (userInfo.tempKey === tempKey) {
      session.logined = true
      session.user_id = userInfo.user_id
      session.user_name = userInfo.user_name
      session.user_kind = userInfo.user_kind

      await redisClient.del(user_id)

      res.sendFile(__dirname + '/client/chat.html')
      return true
    }
  } catch(e) {
    console.log(e)
    res.sendStatus(500)
    return false
  } finally {
    if (redisClient.connected) redisClient.quit()
  }

  res.sendStatus(404)
  return false
}

module.exports = setUser