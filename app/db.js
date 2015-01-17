var Level = require('level');
var Sublevel = require('level-sublevel');
var after = require('after');

var db = Sublevel(Level('./db'));

var index = db.sublevel('index');
var images = db.sublevel('imgs');

var getImage = images.getImage = function getImage(key, callback) {
  images.get(key, callback);
};

var getImageData = images.getImageData = function getImageData(index, keys, callback) {
  if (typeof keys === 'function') {
    callback = keys;
    keys = undefined;
  }
  var data = {
    index: index
  };
  keys = keys || {
    imageURI: index + '--large',
    imageURISmall: index + '--small',
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

var getLatest = index.getLatest = function getLatest(callback) {
  index.get('HEAD', callback);
};

var updateIndex = index.updateIndex = function updateIndex(key) {
  return function update(err) {
    if (err)
      return console.log(err);
    index.batch([
      { type: 'put', key: '' + Date.now(), value: key },
      { type: 'put', key: 'HEAD', value: key }
    ], function(err) {
      if (err)
        return console.log(err);
      console.log((new Date()).toLocaleString() + ': Index at ' + key);
    });
  };
};

module.exports = {
  index: index,
  images: images
};
