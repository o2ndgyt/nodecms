var fs = require('fs');
var glob = require("glob");
var url = require('url');

var comfunc = {
    SearchTextinFile: function (searchStr, file, caseSensitive) {
   
      var str = fs.readFileSync(file, 'utf8');
    
      var searchStrLen = searchStr.length;
      if (searchStrLen == 0) {
          return [];
      }
      var startIndex = 0, index,indices=[];
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
  GetSections:function (indexes, file) { 
        var indices=[];
        var str = fs.readFileSync(file, 'utf8');
        if (indexes.length==0){ return indices;}

        indexes.forEach(function(element) {
            var str1=str.substring(element);
            var str2=str1.indexOf(')');
            var str3=str.substring(element+11,element+str2-1);
            if (str3!="HeaderScript" && str3!="BodyScript" && str3!="FooterScript" )
            indices.push(str3);

          });
          
        
        return indices;   

  },
  FileList: function(){
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