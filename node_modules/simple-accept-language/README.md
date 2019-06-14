# simple-accept-language

## WARNING [BETA]

It parses the accept-language http header, for languages used by the client's browser and choose the one with the biggest quality factor.

Returns a two letters string:
- "en" for english (en-US, en-UK, en...)
- "fr" for french (fr-FR, fr...)
- ...
For clients without accept-language in http header (like crawlers, bots or curl), returns:
- "crawler"

## Installation

```bash
$ npm install simple-accept-language
```

## Quick Start with the Express framework

```js
var express = require('express'),
simpleLanguage = require('simple-accept-language'),
app = express();

app.get('/', function (req, res) {
  console.log(simpleLanguage(req));
  res.send(simpleLanguage(req));
});

app.listen(3000);
```

## TODO

- Testing