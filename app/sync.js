var config = require('config');
var db = require('./db');
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
