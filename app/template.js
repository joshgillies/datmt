var h = require('mercury').h;

var layout = function layout(state) {
  return h('html', [
    h('head', [
      h('title', 'Hello Mt. Wellington!')
    ]),
    h('body', {
      'style': {
        'background': 'url(' + state.dataURI + ')',
        'background-size': 'cover',
        'margin': '0'
      }
    }, [
      h('img', {
        'src': state.imageURI,
        'style': {
          'width': '100%'
        },
        'alt': 'Mt. Wellington as seen at ' + state.timeStamp
      })
    ])
  ]);
};

var archive = function archive(state) {
  return h('html', [
    h('head', [
      h('title', 'Hello Mt. Wellington!')
    ]),
    h('body', Object.keys(state).map(function(image) {
      return h('a', {
        'href': '/' + image,
        'style': {
          'float': 'left'
        }
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
