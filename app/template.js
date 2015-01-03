var h = require('mercury').h;

var layout = function layout(state) {
  return h('html', [
    h('head', [
      h('title', 'Hello Mt. Wellington!')
    ]),
    h('body', {
      'style': 'background:' + state.dataURI + ';background-size:cover;margin:0;'
    }, [
      h('img', {
        'src': state.imageURI,
        'style': 'width:100%;',
        'alt': 'Mt. Wellington as seen at ' + state.timeStamp
      })
    ])
  ]);
};

module.exports = layout;
