var imageVariations = require('./image-variations');
var createImages = require('create-images');
var JPEGDecoder = require('jpg-stream/decoder');
var config = require('config');
var after = require('after');
var Peeq = require('peeq');
var AWS = !config.aws || require('./aws');
var db = require('./db');

var next;
var images = imageVariations();

images.on('small', function(image) {
  var dataURI = 'data:image/jpeg;base64,' + image.body.toString('base64');
  db.images.put(image.name + '!dataUri', dataURI, console.log);
});

images.on('image', function(image) {
  var s3obj = new AWS.S3({params: {Bucket: config.aws.s3.bucket, Key: image.name + '.jpg'}});
  s3obj.upload({ACL: 'public-read', Body: image.body})
    .send(function(err, data) {
      if (err) return console.log(err);
      db.images.put(image.name, data.Location, next);
    });
});

var resource = Peeq(config.remoteResource, 60000);

resource.on('response', function processImageResponse(res) {
  var lastModified = new Date(res.headers['last-modified']);
  var timeStamp = lastModified.toISOString();

  next = after(2, db.images.updateIndex(timeStamp));

  res
    .pipe(new JPEGDecoder)
    .pipe(createImages(images.toObject(), timeStamp));
});

resource.on('error', function(err) {
  console.log(err);
});
