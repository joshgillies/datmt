var server = require('./server');
var config = require('config');
var processImages = require('./process-images');

processImages.on('error', function(err) {
  console.log(err);
});

server.listen(process.env.PORT || config.port, config.host, function() {
  var info = server.address();
  console.log('Server running at "%s:%d"', info.address, info.port);
});

