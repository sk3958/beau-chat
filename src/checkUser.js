const RedisUtil = require('./redisUtil')
const Cryptr = require('cryptr')
const User = require('./user')
const cryptr = new Cryptr(process.env.SESSION_SECRET)

async function setUser (req, res, isRootUrl) {
  let session = req.session
  if (session.logined && session.user_id.length > 0 && session.user_kind.length === 2) {
		try {
			await addUser(session)
		} catch(e) {
			console.log(e)
      res.sendStatus(500)
      return false
		}

		if (isRootUrl) {
			res.redirect('/classroom')
		} else {
			res.render('chat.html', session)
		}

    return true
  }

  try {
    const { param1, param2 } = req.params
    if (undefined === param1 || undefined === param2) {
      res.sendStatus(404)
      return false
    }

    const user_id = cryptr.decrypt(param1)
    const tempKey = cryptr.decrypt(param2)

		const key = RedisUtil.Keys.login.prefix + user_id
    const info = await RedisUtil.get(key)
    if (!info) {
      res.sendStatus(404)
      return false
    }

    const userInfo = JSON.parse(info)
    if (userInfo.tempKey === tempKey) {
      session.logined = true
      session.user_id = userInfo.user_id
      session.user_name = userInfo.user_name
      session.user_kind = userInfo.user_kind

      await RedisUtil.del(key)

			await addUser(session)
			res.redirect('/classroom')
      return true
    }
  } catch(e) {
    console.log(e)
    res.sendStatus(500)
    return false
  }

  res.sendStatus(404)
  return false
}

function addUser (session) {
	if (!User.isUser(User.getUser(session.user_id)))
	{
		const user = new User(session.user_id, session.user_name, session.user_kind)

		let key = RedisUtil.Keys.user.prefix + session.user_id
		let ttl = RedisUtil.Keys.user.ttl
		let sessionId = 'sess:' + session.id
		return new Promise((resolve, reject) => {
			RedisUtil.hset(key, 'sessionId', sessionId)
				.then(() => {
					RedisUtil.expire(key, ttl)
						.then(() => {
							resolve(user)
						})
						.catch((err2) => {
							reject(err2)
						})
				})
				.catch((err) => {
					reject(err)
				})
		})
	} else {
		return Promise.resolve(1)
	}
}

module.exports = setUser
