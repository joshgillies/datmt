var db = require('./db');
var config = require('config');
var AWS = !config.aws || require('./aws');

var s3 = new AWS.S3({apiVersion: '2006-03-01'});

var getBucketRegion = (function getBucketRegion(bucket) {
  var params = {
    Bucket: bucket
  };
  s3.getBucketLocation(params, function(err, data) {
    if (err)
      return console.log(err);
    getObjects(bucket, data.LocationConstraint);
  });
})(config.aws.s3.bucket);

var getObjects = function getObjects(bucket, region, marker) {
  var params = {
    Bucket: bucket,
    Marker: marker || ''
  };
  s3.listObjects(params, function(err, data) {
    if (err)
      return console.log(err);

    if (data.Contents.length)
      getObjects(bucket, region, data.Contents[data.Contents.length - 1].Key);

    data.Contents.forEach(function createData(item) {
      if (/small/g.test(item.Key))
        getThumbnailData(bucket, item.Key);
      db.images.put(
        item.Key.replace('.jpg', ''),
        'https://' + bucket + '.s3-' + region + '.amazonaws.com/' + item.Key
      );
    });

    data.Contents.map(function generateKey(item) {
      return item.Key.replace(/--(small|large).jpg/g,'');
    }).filter(function unique(value, index, array) {
      return array.indexOf(value) === index;
    }).forEach(function writeIndex(key) {
      db.index.put('' + (new Date(key)).valueOf(), key);
    });
  });
};

var getThumbnailData = function getObjectDetails(bucket, key) {
  var params = {
    Bucket: bucket,
    Key: key,
  };
  s3.getObject(params, function writeDataUri(err, data) {
    if (err)
      return console.log(err, err.stack);

    db.images.put(key + '!dataUri', 'data:image/jpeg;base64,' + data.Body.toString('base64'));
  });
};
