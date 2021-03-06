var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');


var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var config = require("./config");

var routes = require('./routes/index');

var users = require('./app/controllers/users');
var sessions = require('./app/controllers/sessions');
var admin = require('./app/controllers/admin');
var master = require('./app/controllers/master');


var app = express();
var http = require('http').Server(app);
// Socket.io here
var io = require('socket.io')(http);


// View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
// app.set('view engine', 'html');

app.use(favicon());
app.use(logger('dev'));

app.use(bodyParser.json({ type: 'application/*+json' }))
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.text({type: "json"}));

app.use(methodOverride());
app.use(cookieParser(config.dev.cookiePassword));
app.use(express.static (path.join(__dirname, 'public')));

// app.use('/', routes);
app.get('/', function(req, res){
  res.render('index', {});
});

app.use('/api/v1/users', users);
app.use('/api/v1/sessions', sessions);
app.use('/api/v1/admin', admin);
app.use('/api/v1/master', master);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: "ERRORORORRORORO"
    });
});


io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected :(');
  });
});

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'

// http.listen(server_port, server_ip_address, function(){
//   console.log('listening on port ' + server_port);
// });


module.exports = app;
