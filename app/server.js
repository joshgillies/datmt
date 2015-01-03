var http = require('http');
var Router = require('routes-router');
var sendHtml = require('send-data/html');
var stringify = require('virtual-dom-stringify');
var after = require('after');
var db = require('./db');
var ecstatic = require('ecstatic')({
  root: __dirname + '/assets',
  showDir: false,
  autoIndex: true
});

var template = require('./template');

var getLatest = function getLatest(req, res, callback) {
  var state = {};
  var next = after(3, function(err) {
    callback(err, state);
  });

  db.images.get('index', function(err, index) {
    state.timeStamp = (new Date(index)).toLocaleString();
    next(err);

    db.images.get(index + '--large', function getImageURI(err, value) {
      state.imageURI = value;
      next(err);
    });

    db.images.get(index + '--small!dataUri', function getDataURI(err, value) {
      state.dataURI = value.toString();
      next(err);
    });
    /*
    db.images.createReadStream({ start: index, end: index + '\xff' })
      .on('data', function (data) {
        console.log(data.key, '=', data.value);
      });
     */
  });
};

var app = Router();

app.addRoute('/', function (req, res, opts, cb) {
  getLatest(req, res, function (err, data) {
    if (err)
      return cb(err);

    var vtree = template(data);

    sendHtml(req, res, '<!DOCTYPE html>' + stringify(vtree));
  });
});

module.exports = http.createServer(app);
