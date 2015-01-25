var config = require('config');
var db = require('./db');

if (config.syncUri) {
  var MAX_REQUESTS = 40; // science!
  var currentRequests = 0;
  var hyperquest = require('hyperquest');
  var concat = require('concat-stream');
  var Level = require('level');

  var getJson = function(uri, callback) {
    var req = hyperquest(uri);
    req.setHeader('user-agent', 'MtSyncAgent/1.0');
    req.setHeader('accept', 'application/json');
    req.on('response', function onResponse(res) {
      if (res.statusCode === 200)
        return res.pipe(concat(function toJSON(data) {
          callback(null, JSON.parse(data.toString()));
        }));

      return callback(new Error('Resource Not Found'));
    });
    req.on('error', callback);
  };

  var tmp = Level('/tmp/' + Date.now());

  var stream = tmp.createKeyStream();

  stream.pause();

  var getArchiveData = (function getArchiveData(syncUri) {
    getJson(syncUri, function archiveData(err, json) {
      if (err) {
        stream.resume();
        return console.log(err);
      }

      var keys = Object.keys(json);
      var length = keys.length;

      keys.forEach(function(key, index) {
        if (length === (index + 1))
          getArchiveData(config.syncUri + '/' + key[index]);
        tmp.put(key, key, console.log);
      });
    });
  })(config.syncUri);

  stream.on('error', console.log);
  stream.on('data', function getKeys(key) {
    if (currentRequests === MAX_REQUESTS)
      stream.pause();

    currentRequests++;

    getJson(config.serviceUri + '/' + key, function(err, data) {
      if (err)
        return console.log(config.serviceUri + '/' + key,err);
      console.log(config.serviceUri + '/' + key);
      db.images.batch([
        { types: 'put', key: data.index + '--large', value: data.imageURI },
        { types: 'put', key: data.index + '--small', value: data.imageURISmall },
        { types: 'put', key: data.index + '--small!dataUri', value: data.dataURI }
      ], function finish(err) {
        if (err) return console.log(err);
        db.index.put('' + (new Date(data.index)).valueOf(), data.index);

        currentRequests--;

        if (!currentRequests)
          stream.resume();
      });
    });
  });

} else {
  var s3 = require('dal/s3');

  var bucket = config.aws.s3.bucket;

  var getObjects = function getObjects(region) {
    return function processObjects(err, data) {
      if (err)
        return console.log(err);

      if (data.Contents.length) {
        s3.getObjects.apply(null, [
          bucket,
          region,
          data.Contents[data.Contents.length - 1].Key,
          getObjects(region)
        ]);
      }

      data.Contents.forEach(function createData(item) {
        var key = item.Key;
        if (/small/g.test(key)) {
          s3.getObjectDetails(bucket, key, function writeDataUri(err, data) {
            if (err)
              return console.log(err);

            db.images.put(key.replace('.jpg', '!dataUri'), 'data:image/jpeg;base64,' + data.Body.toString('base64'));
          });
        }

        db.images.put(
          key.replace('.jpg', ''),
          'https://' + bucket + '.s3-' + region + '.amazonaws.com/' + key
        );
      });

      data.Contents.map(function generateKey(item) {
        return item.Key.replace(/--(small|large).jpg/g,'');
      }).filter(function unique(value, index, array) {
        return array.indexOf(value) === index;
      }).forEach(function writeIndex(key) {
        db.index.put('' + (new Date(key)).valueOf(), key);
      });
    };
  };

  s3.getBucketRegion(bucket, function getRegion(err, data) {
    if (err)
      return console.log(err);
    var region = data.LocationConstraint;
    s3.getObjects(bucket, region, getObjects(region));
  });
}
