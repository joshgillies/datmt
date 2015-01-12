var db = require('./db');
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
  var archive = {};
  db.index.createReadStream({ reverse: true })
    .on('data', function(data) {
      var key = data.value;
      db.images.getImageData(key, function(err, data) {
        delete data.dataURI;
        archive[key] = data;
      });
    })
    .on('end', function() {
      mediaTypes({
        'text/html': function htmlResp(req, res) {
          var vtree = template.archive(archive);

          sendHtml(req, res, '<!DOCTYPE html>' + stringify(vtree));
        },
        'application/json': function jsonResp(req, res) {
          sendJson(req, res, archive);
        }
      }).call(null, req, res, opts, next);
    });
};

var routes = {
  '/': indexRoute,
  '/:id': imageRoute,
  '/archive': archiveRoute
};

for (var route in routes) {
  router.set(route, routes[route]);
}

module.exports = router;
