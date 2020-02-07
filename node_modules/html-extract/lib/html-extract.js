var cheerio = require('cheerio');

module.exports = HTMLExtract;

function HTMLExtract(html, rules) {
  var $ = cheerio.load(html);
  var data = {};
  var name;

  for (name in rules) {
    data[name] = rules[name].call(html, $);
  }

  return data;
}
