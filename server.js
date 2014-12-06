var http = require('http');
var ecstatic = require('ecstatic')({
  root: __dirname + '/public',
  showDir: true,
  autoIndex: true
});

module.exports = http.createServer(ecstatic);
