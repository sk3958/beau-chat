const redis = require('redis')
const Cryptr = require('cryptr')
const cryptr = new Cryptr(process.env.SESSION_SECRET)

async function setUser (req, res) {
  let session = req.session
  if (session.logined && session.user_id.length > 0 && session.user_kind.length === 2) {
    res.render('chat.html', session)
    return true
  }

  const redisClient = redis.createClient(process.env.REDIS_PORT || 6379)
  try {
    const { param1, param2 } = req.params
    if (undefined === param1 || undefined === param2) {
      res.sendStatus(404)
      return false
    }

    user_id = cryptr.decrypt(param1)
    tempKey = cryptr.decrypt(param2)

    const info = await redisClient.get(user_id)
    const userInfo = JSON.parse(info)
    if (userInfo.tempKey === tempKey) {
      session.logined = true
      session.user_id = userInfo.user_id
      session.user_name = userInfo.user_name
      session.user_kind = userInfo.user_kind

      await redisClient.del(user_id)

      res.render('chat.html', session)
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