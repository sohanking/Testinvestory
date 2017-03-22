//Form validation
//var appForm = angular.module('Login', ['ngMessages']);
//var appForm = angular.module('Signin', ['ngMessages']);

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');

var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session      = require('express-session');
var configDB = require('./config/database.js');
var asyncn = require('async');
var crypto = require('crypto');

var flash    = require('connect-flash');
var routes   = require('./app/routes.js');
var pp       = require('./config/passport');
var useragent = require('express-useragent');
var port = 3001;

mongoose.Promise = global.Promise;
mongoose.connect(configDB.url); // connect to our database

pp(passport); 


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
 app.use(useragent.express());
// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({ secret: 'plasticwaterlabs' })); // session secret

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());
//app.use('/', index);
//app.use('/faqs', faqs);

routes(app, passport);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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



