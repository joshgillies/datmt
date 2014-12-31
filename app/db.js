var Level = require('level');
var Sublevel = require('level-sublevel');

var db = Sublevel(Level('./db'));

var logs = db.sublevel('logs');
var images = db.sublevel('imgs');

images.updateIndex = function updateIndex(index) {
  return function update(err) {
    if (err)
      return console.log(err);
    images.put('index', index, console.log);
  };
};

module.exports = {
  logs: logs,
  images: images
};
