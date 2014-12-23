var JPEGDecoder = require('jpg-stream/decoder');
var GIFEncoder = require('gif-stream/encoder');
var concat = require('concat-frames');
var neuquant = require('neuquant');
var gs = require('glob-stream');
var fs = require('fs');

var encodeStream = new GIFEncoder(400,300);
encodeStream.pipe(fs.createWriteStream('out.gif'));

var files = [];

gs.create('./public/**/*--small.jpg')
  .on('data', function(file) {
    var path = file.path;
    var idx;
    files.push(path);
    fs.createReadStream(path)
      .pipe(new JPEGDecoder)
      .pipe(new neuquant.Stream)
      .pipe(concat(function(frames) {
        console.log(files.length);
        var frame = frames[0];
        idx = files.indexOf(path);
        files.splice(idx, 1);
        encodeStream.addFrame({ palette: frame.palette });
        encodeStream.write(frame.pixels);
        if (!files.length)
          encodeStream.end();
      }));
  });
