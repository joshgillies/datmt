var Level = require('level');
var Sublevel = require('level-sublevel');

var db = Sublevel(Level('./db'));

var logs = db.sublevel('logs');
var images = db.sublevel('imgs');

module.exports = {
  logs: logs,
  images: images
};
