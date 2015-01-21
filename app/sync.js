var s3 = require('dal/s3');
var config = require('config');

var bucket = config.aws.s3.bucket;

s3.getBucketRegion(bucket, function(err, data) {
  if (err)
    return console.log(err);
  s3.getObjects(bucket, data.LocationConstraint, function done() {
    console.log('sync complete!');
  });
});
