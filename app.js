// detect environment
const env = process.env.NODE_ENV ? process.env.NODE_ENV : 'production';
console.log('Running on ' + env + ' environment.');

// initialize Sentry
const sentry = require('@sentry/node');
if ("SENTRY_DSN" in process.env)
{
  sentry.init({
    dsn: process.env.SENTRY_DSN,
    debug: env === 'development'
  });

  sentry.configureScope(scope => {
    scope.setTag('environment', env);
  });

  console.log('Sentry initialized.');
} else console.log('Sentry DSN not configured, skipping Sentry initialization.');

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const jwt = require('jsonwebtoken');

var indexRouter = require('./routes/index');
var authenticateRouter = require('./routes/authenticate');

var app = express();
app.use(sentry.Handlers.requestHandler());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
if ('TRUST_PROXY' in process.env)
{
  console.log('Trust proxy: ' + process.env.TRUST_PROXY);
  app.set('trust proxy', process.env.TRUST_PROXY);
}

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// make sure jwt token is configured
app.use(function(req, res, next) {
  if ("JWT_SECRET" in process.env)
    next();
  else
    res.status(500).send(
      req.app.get('env') === "development" ?
      "JWT Secret not configured." :
      "Configuration error."
    );
});

// make sure the webhook is configured
app.use(function(req, res, next) {
  if ("WEBHOOK" in process.env)
    next();
  else
    res.status(500).send(
      req.app.get('env') === "development" ?
      "Webhook not configured." :
      "Configuration error."
    );
});

// check if authenticated
app.use(function(req, res, next) {
  if ('GLOBAL_MESSAGE' in process.env)
    res.locals.global_message = process.env.GLOBAL_MESSAGE

  try {
    const token = req.cookies['auth'];
    jwt.verify(token, process.env.JWT_SECRET, function(err, payload) {
      if (payload && payload.authenticated) {
        req.authenticated = true;
        res.locals.authenticated = req.authenticated;
      }
      next();
    });
  } catch(err) {
    next();
  }
});

app.use(function(req, res, next) {
  if (!req.authenticated && req.path !== "/authenticate")
    res.redirect("/authenticate");
  else
    next();
});

app.use('/', indexRouter);
app.use('/authenticate', authenticateRouter);

app.use(sentry.Handlers.errorHandler());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.redirect('/');
  //next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
