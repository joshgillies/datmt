var router = require('./router');
var http = require('http');
var st = require('st');

var mount = st({
  path: __dirname + '/assets',
  index: false,
  passthrough: true
});

module.exports = http.createServer(function(req, res) {
  mount(req, res, function passThrough() {
    router(req, res, {}, function onError(err) {
      if (err) {
        res.statusCode = err.statusCode || 500;
        res.end(err.message);
      }
    });
  });
});
