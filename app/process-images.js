var imageVariations = require('./image-variations');
var createImages = require('create-images');
var JPEGDecoder = require('jpg-stream/decoder');
var config = require('config');
var after = require('after');
var AWS = !config.aws || require('./aws');
var db = require('./db');

var processImages = function processIamges(callback) {
  return function processImageResponse(res) {
    var lastModified = res.headers['last-modified'];
    var timeStamp;

    try {
      timeStamp = (new Date(lastModified)).toISOString();
    } catch(err) {
      return callback(new Error(lastModified + ' not a valid date. ' + err));
    }

    var next = after(2, db.index.updateIndex(timeStamp));
    var images = imageVariations(timeStamp);

    res
      .pipe(new JPEGDecoder)
      .pipe(createImages(images.toJSON()));

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
  };
};

module.exports = processImages;
