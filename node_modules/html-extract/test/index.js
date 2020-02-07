var test = require('simple-test');
var extract = require('../index');

var html = "\
<html>\
  <head>\
  </head>\
  <body>\
    <div id='title'>foo</div>\
    <div class='description'>bar</div>\
  </body>\
</html>\
"

extract(html, {})

test('extract', function () {
  var data = extract(html, {
    title: function ($) {
      return $('#title').text().trim();
    },

    description: function ($) {
      return $('.description').text().trim();
    }
  });

  test.eq(data.title, 'foo');
  test.eq(data.description, 'bar');
});
