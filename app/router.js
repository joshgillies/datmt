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

var image = require('image/template');
var archive = require('archive/template');

var imageHtml = function imageHtml(data) {
  var vtree = image(data);

  return '<!DOCTYPE html>' + stringify(vtree);
};
var archiveHtml = function archiveHtml(data) {
  var vtree = archive(data);

  return '<!DOCTYPE html>' + stringify(vtree);
};

var negotiateContent = function negotiateContent(html, json) {
  return mediaTypes({
    'text/html': function htmlResp(req, res) {
      sendHtml(req, res, html);
    },
    'application/json': function jsonResp(req, res) {
      sendJson(req, res, json);
    }
  });
};

var indexRoute = function indexRoute(req, res, opts, next) {
  db.index.getLatest(function redirectToImage(err, index) {
    if (err)
      return next(err);

    redirect(req, res, '/' + index);
  });
};

var imageRoute = function imageRoute(req, res, opts, next) {
  var findClosest = function findClosest(err, key) {
    if (err)
      return redirect(req, res, '/');
    redirect(req, res, '/' + key);
  };
  var imageData = function imageData(err, data) {
    if (err)
      return db.index.getClosest((new Date(opts.params.id)).valueOf(), findClosest);

    data.timeStamp = (new Date(data.index)).toLocaleString();

    negotiateContent(imageHtml(data), data).call(null, req, res, opts, next);
  };

  db.images.getImageData(opts.params.id, imageData);
};

var archiveRoute = function archiveRoute(req, res, opts, next) {
  var marker = (new Date(opts.params.marker)).valueOf() || Date.now();
  var select = {
    lte: marker,
    gte: marker - (24 * 60 * 60 * 1000)
  };
  var indexStream = db.index.createValueStream(select);

  indexStream
    .pipe(through2.obj(function(index, enc, cb) {
      db.images.getImageData(index, {
        imageURI: index + '--large',
        imageURISmall: index + '--small'
      }, function getData(err, data) {
        if (err) {
          console.log(err, index);
          return cb();
        }

        cb(null, data);
      });
    }))
    .pipe(concat(function respond(data) {
      if (Array.isArray(data)) data.reverse();
      negotiateContent(archiveHtml(data), data).call(null, req, res, opts, next);
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
