var concat = require('concat-frames');
var JPEGDecoder = require('jpg-stream/decoder');
var JPEGEncoder = require('jpg-stream/encoder');
var PassThrough = require('readable-stream').PassThrough;
var resize = require('resizer-stream');
var after = require('after');
var config = require('config');
var AWS = !config.aws || require('./aws');
var db = require('./db');
var bl = require('bl');

var createVariations = function createVariations(variations, data) {
  var width = data.width;
  var height = data.height;
  var pixels = data.pixels;

  var imageStream = new PassThrough();

  for (var variation in variations) {
    variations[variation](imageStream, {
      name: variation,
      width: width,
      height: height
    });
  }

  imageStream.emit('format', {
    width: width,
    height: height,
    colorSpace: data.colorSpace
  });
  imageStream.end(pixels);
};

var processImages = function processImages(res) {
  var lastModified = new Date(res.headers['last-modified']);
  var timeStamp = lastModified.toISOString();
  var next = after(2, db.images.updateIndex(timeStamp));
  var variations = {};

  variations[timeStamp + '--small'] = function createSmall(stream, info) {
    stream
      .pipe(resize({ width: info.width / 4, height: info.height / 4, fit: true }))
      .pipe(new JPEGEncoder({ quality: 70 }))
      .pipe(bl(function(err, data) {
        if (err)
          return console.log(err);

        var dataURI = 'data:image/jpeg;base64,' + data.toString('base64');
        db.images.put(info.name + '!dataUri', dataURI);

        var s3obj = new AWS.S3({params: {Bucket: config.aws.s3.bucket, Key: info.name + '.jpg'}});
        s3obj.upload({ACL: 'public-read', Body: data})
          .send(function(err, data) {
            if (err) return console.log(err);
            db.images.put(info.name, data.Location, next);
          });
      }));
  };
  variations[timeStamp + '--large'] = function createLarge(stream, info) {
    stream
      .pipe(new JPEGEncoder({ quality: 70 }))
      .pipe(bl(function(err, data) {
        if (err)
          return console.log(err);
        var s3obj = new AWS.S3({params: {Bucket: config.aws.s3.bucket, Key: info.name + '.jpg'}});
        s3obj.upload({ACL: 'public-read', Body: data})
          .send(function(err, data) {
            if (err) return console.log(err);
            db.images.put(info.name, data.Location, next);
          });
      }));
  };

  var jpegStream = res.pipe(new JPEGDecoder);

  jpegStream
    .pipe(concat(function(frames) {
      createVariations(variations, frames[0]);
    }));
};

module.exports = processImages;
