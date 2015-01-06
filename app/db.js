var Level = require('level');
var Sublevel = require('level-sublevel');
var after = require('after');

var db = Sublevel(Level('./db'));

var logs = db.sublevel('logs');
var images = db.sublevel('imgs');

var updateIndex = images.updateIndex = function updateIndex(index) {
  return function update(err) {
    if (err)
      return console.log(err);
    images.put('index', index, function(err) {
      if (err)
        return console.log(err);
      console.log((new Date()).toLocaleString() + ': Index at ' + index);
    });
  };
};

var getImage = images.getImage = function getImage(key, callback) {
  images.get(key, callback);
};

var getImageData = images.getImageData = function getImageData(index, callback) {
  var data = {
    index: index
  };
  var keys = {
    imageURI: index + '--large',
    dataURI: index + '--small!dataUri'
  };
  var next = after(Object.keys(keys).length, function(err) {
    callback(err, data);
  });
  var getImageFromKey = function getImageFromKey(key) {
    getImage(keys[key], function getData(err, value) {
      data[key] = value;
      next(err);
    });
  };

  for (var key in keys) {
    getImageFromKey(key);
  }
};

var getLatest = images.getLatest = function getLatest(callback) {
  images.get('index', callback);
};

module.exports = {
  logs: logs,
  images: images
};
