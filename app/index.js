var processImages = require('./process-images');
var server = require('./server');
var config = require('config');
var Peeq = require('peeq');

var resource = Peeq(config.remoteResource, 60000);

resource.on('response', processImages(function(err) {
  console.log('Error processing images: ', err);
}));

resource.on('error', function(err) {
  console.log('Error with resource request: ', err);
});

resource.on('end', function() {
  console.log('ended');
  setTimeout(function() {
    resource.start();
  }, 30000);
});

server.listen(config.port, config.host, function() {
  var info = server.address();
  console.log('Server running at "%s:%d"', info.address, info.port);
});

