var h = require('mercury').h;

var layout = function layout(state) {
  return h('html', [
    h('head', [
      h('title', 'Hello Mt. Wellington!'),
      h('link', {
        'href': '/css/style.css',
        'rel': 'stylesheet',
        'type': 'text/css'
      })
    ]),
    h('body', {
      'style': {
        'background': 'url(' + state.dataURI + ')'
      }
    }, [
      h('img', {
        'class': 'cover-image',
        'src': state.imageURI,
        'alt': 'Mt. Wellington as seen at ' + state.timeStamp
      })
    ])
  ]);
};

var archive = function archive(state) {
  return h('html', [
    h('head', [
      h('title', 'Hello Mt. Wellington!'),
      h('link', {
        'href': '/css/style.css',
        'rel': 'stylesheet',
        'type': 'text/css'
      })
    ]),
    h('body', Object.keys(state).map(function(image) {
      return h('a', {
        'href': '/' + image,
        'class': 'image-grid'
      }, [
        h('img', {
          'src': state[image].imageURISmall,
          'alt': 'Mt. Wellington as seen at ' + state[image].timeStamp
        })
      ]);
    })
    )
  ]);
};

module.exports = {
  layout: layout,
  archive: archive
};
