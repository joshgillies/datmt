var http = require('http');
var Router = require('routes-router');
var redirect = require('redirecter');
var sendHtml = require('send-data/html');
var stringify = require('virtual-dom-stringify');
var db = require('./db');
var ecstatic = require('ecstatic')({
  root: __dirname + '/assets',
  showDir: false,
  autoIndex: true
});

var template = require('./template');

var app = Router();

app.addRoute('/', function indexRoute(req, res, opts, cb) {
  db.images.getLatest(function imageData(err, data) {
    if (err)
      return cb(err);

    data.timeStamp = (new Date(data.index)).toLocaleString();

    var vtree = template(data);

    sendHtml(req, res, '<!DOCTYPE html>' + stringify(vtree));
  });
});

module.exports = http.createServer(app);
