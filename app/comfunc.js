var fs = require('fs');
var glob = require('glob');
var url = require('url');

var comfunc = {
  SearchTextinFile: function (searchStr, file, caseSensitive) {

    var str = fs.readFileSync(file, 'utf8');

    var searchStrLen = searchStr.length;
    if (searchStrLen == 0) {
      return [];
    }
    var startIndex = 0, index, indices = [];
    if (!caseSensitive) {
      str = str.toLowerCase();
      searchStr = searchStr.toLowerCase();
    }

    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
      indices.push(index);
      startIndex = index + searchStrLen;
    }

    return indices;
  },
  GetSections: function (file, HeadId) {
    var searchintext = "@!section('";
    var data = this.SearchTextinFile(searchintext, file, false);

    var indices = [];
    var str = fs.readFileSync(file, 'utf8');
    if (data.length == 0) { return indices; }

    data.forEach(function (element) {
      var str1 = str.substring(element);
      var str2 = str1.indexOf(')');
      var str3 = str.substring(element + searchintext.length, element + str2 - 1);

      //except head,body,footer js script
      if (str3 != "HeaderScript" && str3 != "BodyScript" && str3 != "FooterScript") {
        var id = '_' + Math.random().toString(36).substr(2, 9);
        if (str3.substr(0, 3).toLowerCase() == "ad_")
          indices.push({ "Id": id, "HeadId": HeadId, "Mode": "A", "Section": str3, "GroupID": "-1", "Data": "" });
        if (str3.substr(0, 4).toLowerCase() == "mod_")
          indices.push({ "Id": id, "HeadId": HeadId, "Mode": "M", "Section": str3, "GroupID": "-1", "Data": "" });
      }
    });


    return indices;

  },
  FileList: function () {
    return glob.sync("./views/*.edge");
  },
  FullURl: function fullUrl(req) {
    return url.format({
      protocol: req.protocol,
      host: req.get('host'),
      pathname: req.originalUrl
    });
  }

};

module.exports = comfunc;