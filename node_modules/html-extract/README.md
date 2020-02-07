html-extract
==========

HTML data extraction


## Installation
```bash
npm install html-extract
```


## Quick Start
```javascript
var extract = require('html-extract');

var data = extract("<html>...</html>", {
  title: function ($) {
    return $('#title').text().trim();
  },

  description: function ($) {
    return $('.description').text().trim();
  },

  tags: function ($) {
    var tags = [];

    $('#tags > a').each(function (index, item) {
      tags.push($(item).text().trim());
    });

    return tags;
  }
});
```


## API

## License

  MIT
