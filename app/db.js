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

var getNext = index.getNext = function getNext(marker, callback) {
  var select = {
    gt: marker,
    limit: 1
  };
  index.createValueStream(select)
    .on('data', function onData(value) {
      callback(null, value);
    })
    .on('error', function onError(err) {
      callback(err);
    });
};

var getPrevious = index.getPrevious = function getPrevious(marker, callback) {
  var select = {
    lt: marker,
    reverse: true,
    limit: 1
  };
  var hasValue = false;
  var onData = function onData(value) {
    hasValue = true;
    callback(null, value);
  };
  var onError = function onError(err) {
    callback(err);
  };
  var onEnd = function onEnd() {
    if(!hasValue) {
      index.createValueStream({
        lt: Date.now(),
        limit: 1
      })
        .on('data', onData)
        .on('error', onError)
        .on('end', function fail() {
          if(!hasValue)
            callback(new Error('No previous value found in the database!'));
        });
    }
  };

  index.createValueStream(select)
    .on('data', onData)
    .on('error', onError)
    .on('end', onEnd);
};

var getLatest = index.getLatest = function getLatest(callback) {
  getPrevious(Date.now(), callback);
};

var updateIndex = index.updateIndex = function updateIndex(key) {
  return function update(err) {
    if (err)
      return console.log(err);
    index.put('' + (new Date(key)).valueOf(), key, function(err) {
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
