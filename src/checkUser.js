const redisUtil = require('./redisUtil')
const Cryptr = require('cryptr')
const User = require('./user')
const cryptr = new Cryptr(process.env.SESSION_SECRET)

async function setUser (req, res, isRootUrl) {
  let session = req.session
  if (session.logined && session.user_id.length > 0 && session.user_kind.length === 2) {
		addUser(session)
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

    const info = await redisUtil.get(user_id)
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

      await redisUtil.del(user_id)

			addUser(session)
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
		user.sessionId = 'sess:' + session.id
		return user
	}
	return null
}

module.exports = setUser
