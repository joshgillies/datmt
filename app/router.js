var db = require('./db');
var redirect = require('redirecter');
var sendHtml = require('send-data/html');
var stringify = require('virtual-dom-stringify');
var HttpHashRouter = require('http-hash-router');

var router = HttpHashRouter();
var template = require('./template');

var routes = {
  '/': function indexRoute(req, res, next) {
    db.images.getLatest(function redirectToImage(err, index) {
      if (err)
        return next(err);

      redirect(req, res, '/' + index);
    });
  },
  '/:id': function imageRoute(req, res, opts) {
    var imageData = function imageData(err, data) {
      if (err)
        return redirect(req, res, '/');

      data.timeStamp = (new Date(data.index)).toLocaleString();

      var vtree = template(data);

      sendHtml(req, res, '<!DOCTYPE html>' + stringify(vtree));
    };

    db.images.getImageData(opts.params.id, imageData);
  },
  '/archive': function archiveRoute(req, res) {
    res.end('The eventual archive of images.');
  }
};

for (var route in routes) {
  router.set(route, routes[route]);
}

module.exports = router;
