var fs = require('fs');
var Peeq = require('peeq');
var trumpet = require('trumpet');
var concat = require('concat-frames');
var server = require('./server');
var JPEGEncoder = require('jpg-stream/encoder');
var JPEGDecoder = require('jpg-stream/decoder');
var through2 = require('through2');
var resize = require('resizer-stream');
var bl = require('bl');
var PassThrough = require('readable-stream').PassThrough;

var writeFile = function writeFile(path, callback) {
  if (!callback) {
    callback = function(err) {
      if(err) return console.log(err);
    };
  }

  var ws = fs.createWriteStream(path);
  ws.on('error', function(err) {
    callback(err);
  });
  ws.once('finish', function() {
    callback(null);
  });
  return ws;
};

var resource = Peeq('http://www.rosebay.tased.edu.au/webcam/large.jpg', 1000);

resource.on('response', function(res) {
  var lastModified = new Date(res.headers['last-modified']);
  var timeStamp = lastModified.toISOString();
  var tr = trumpet();
  var processImages = function processImages(frames) {
    var count = 1;
    var frame = frames[0];
    var width = frame.width;
    var height = frame.height;
    var pixels = frame.pixels;
    var done = function done(err) {
      if (err) return console.log(err);
      if (count++ === 2) {
        var ws = tr.select('img').createWriteStream();
        ws.end([
          '<img',
          'src="images/' + timeStamp + '--large.jpg"',
          'alt="Mt Wellington"',
          'style="width:100%"',
          '/>'
        ].join(' '));
        htmlStream.resume();
        tr.pipe(fs.createWriteStream('./public/index.html'));
      }
    };

    var imageStream = new PassThrough();
    var dataStream = bl();

    imageStream
      .pipe(resize({ width: width / 2, height: height / 2, fit: true }))
      .pipe(new JPEGEncoder({ quality: 70 }))
      .pipe(writeFile('./public/images/' + timeStamp + '--medium.jpg', done));

    imageStream
      .pipe(resize({ width: width / 4, height: height / 4, fit: true }))
      .pipe(new JPEGEncoder({ quality: 70 }))
      .pipe(through2(
        function(chunk, enc, cb) {
          dataStream.append(chunk);
          cb(null, chunk);
        },
        function(cb) {
          var dataURI = 'data:image/jpeg;base64,' + dataStream.toString('base64');
          var style = [
            'background:url(' + dataURI + ') no-repeat top center;',
            'background-size:cover;',
            'margin:0;'
          ].join('');
          tr.select('body').setAttribute('style', style);
          cb();
        }
      ))
      .pipe(writeFile('./public/images/' + timeStamp + '--small.jpg', done));

    imageStream.emit('format', {
      width: width,
      height: height,
      colorSpace: frame.colorSpace
    });
    imageStream.end(pixels);
  };

  var htmlStream = fs.createReadStream('./html/index.html');

  htmlStream.pause();
  htmlStream.pipe(tr);

  res
    .pipe(fs.createWriteStream('./public/images/' + timeStamp + '.jpg'));

  res
    .pipe(new JPEGDecoder)
    .pipe(new JPEGEncoder({ quality: 70 }))
    .pipe(fs.createWriteStream('./public/images/' + timeStamp + '--large.jpg'));

  res
    .pipe(new JPEGDecoder)
    .pipe(concat(processImages));
});

resource.on('error', function(err) {
  console.log(err);
});

server.listen(9000);