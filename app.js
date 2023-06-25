var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var MongoStore = require('connect-mongo');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const users = require('./routes/users');

const expressSession = require("express-session");
const passport = require("passport");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 


app.use(
  expressSession({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 1000,
    },
    store: MongoStore.create(
      {
        mongoUrl: "mongodb://127.0.0.1:27017/LimsaGram",
        autoRemove: "disabled",
      },
      function (err) {
        console.log(err || "Connected MongoDb SetUp");
      }
    ),
  })
);

app.use(passport.authenticate("session"));

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(users.serializeUser());
passport.deserializeUser(users.deserializeUser());

// 

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
