var http = require('http');
var ecstatic = require('ecstatic')({
  root: __dirname + '/assets',
  showDir: false,
  autoIndex: true
});

module.exports = http.createServer(ecstatic);
