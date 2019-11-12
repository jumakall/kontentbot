var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');

const fs = require('fs');
const authlogfile = 'logs/auth.log';

router.use(function(req, res, next) {
  if (req.authenticated && req.path !== "/logout")
    res.redirect('/')
  else
    next();
});

router.get('/', function(req, res, next) {
  res.render('authenticate');
});

router.post('/', function(req, res, next) {
  if (req.body.password === process.env.AUTH_PASS)
  {
    fs.appendFile(authlogfile, '[' + (new Date()).toISOString() + '][Auth] Success from IP: ' + req.ip + '\n', err => { });

    // token lifetime in seconds
                    // h   m    s
    const expiration = 6 * 60 * 60;
    let cookieOptions = { maxAge: expiration * 1000 };

    if (!('NODE_ENV' in process.env) || process.env.NODE_ENV !== 'development')
      cookieOptions.secure = true;

    const token = jwt.sign({ authenticated: true, exp: Date.now() / 1000 + expiration }, process.env.JWT_SECRET);
    res.cookie('auth', token, cookieOptions);
    res.redirect('/');
  }
  else
  {
    fs.appendFile(authlogfile, '[' + (new Date()).toISOString() + '][Auth] Failure from IP: ' + req.ip + '\n', err => { });
    res.render('authenticate', { msg:"Authentication failure, please check the password." })
  }
});

router.get('/logout', function(req, res, next) {
  res.clearCookie('auth');
  res.redirect('/authenticate');
});

module.exports = router;
