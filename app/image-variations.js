var bl = require('bl');
var EventEmitter = require('events').EventEmitter;
var resize = require('resizer-stream');
var inherits = require('inherits');
var JPEGEncoder = require('jpg-stream/encoder');

function complete(info) {
  var self = this;
  return bl(function processedImageData(err, data) {
    if (err)
      return self.emit('error', err);

    var image = {
      id: self.id,
      name: self.id + '--' + info.type,
      body: data
    };

    self.emit(info.type, image);
    self.emit('image', image);
  });
}

var Variations = function Variations(id) {
  if(!(this instanceof Variations)) return new Variations(id);

  EventEmitter.call(this);

  this.id = id;

};

inherits(Variations, EventEmitter);

Variations.prototype.toObject = function toObject() {
  var self = this;

  return {
    small: function createSmall(image) {
      image
        .pipe(resize({ width: image.width / 4, height: image.height / 4, fit: true }))
        .pipe(new JPEGEncoder({ quality: 70 }))
        .pipe(complete.call(self, image));
    },
    large: function createLarge(image) {
      image
        .pipe(new JPEGEncoder({ quality: 70 }))
        .pipe(complete.call(self, image));
    }
  };
};

module.exports = Variations;
