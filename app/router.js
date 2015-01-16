var db = require('./db');
var concat = require('concat-stream');
var through2 = require('through2');
var redirect = require('redirecter');
var sendJson = require('send-data/json');
var sendHtml = require('send-data/html');
var stringify = require('virtual-dom-stringify');
var mediaTypes = require('media-types');
var HttpHashRouter = require('http-hash-router');

var router = HttpHashRouter();
var template = require('./template');

var indexRoute = function indexRoute(req, res, opts, next) {
  db.index.getLatest(function redirectToImage(err, index) {
    if (err)
      return next(err);

    redirect(req, res, '/' + index);
  });
};

var imageRoute = function imageRoute(req, res, opts, next) {
  var imageData = function imageData(err, data) {
    if (err)
      return redirect(req, res, '/');

    data.timeStamp = (new Date(data.index)).toLocaleString();

    mediaTypes({
      'text/html': function htmlResp(req, res) {
        var vtree = template.layout(data);

        sendHtml(req, res, '<!DOCTYPE html>' + stringify(vtree));
      },
      'application/json': function jsonResp(req, res) {
        sendJson(req, res, data);
      }
    }).call(null, req, res, opts, next);
  };

  db.images.getImageData(opts.params.id, imageData);
};

var archiveRoute = function archiveRoute(req, res, opts, next) {
  var marker = (new Date(opts.params.marker)).valueOf() || Date.now();
  var indexStream = db.index.createReadStream({
    lte: marker,
    gte: marker - (24 * 60 * 60 * 1000),
    reverse: true
  });

  indexStream
    .pipe(through2.obj(function(index, enc, cb) {
      db.images.getImageData(index.value, function getData(err, data) {
        if (err)
          return redirect(req, res, '/archive');

        delete data.dataURI;
        cb(null, data);
      });
    }))
    .pipe(concat(function respond(data) {
      mediaTypes({
        'text/html': function htmlResp(req, res) {
          var vtree = template.archive(data);

          sendHtml(req, res, '<!DOCTYPE html>' + stringify(vtree));
        },
        'application/json': function jsonResp(req, res) {
          sendJson(req, res, data);
        }
      }).call(null, req, res, opts, next);
    }));
};

var routes = {
  '/': indexRoute,
  '/:id': imageRoute,
  '/archive': archiveRoute,
  '/archive/:marker': archiveRoute
};

for (var route in routes) {
  router.set(route, routes[route]);
}

module.exports = router;
