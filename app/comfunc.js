var fs = require('fs'),
glob = require('glob'),
cmsmodulread = require('./app/modules/cmsmodul.read.js'),
JsonDB=require('node-json-db'),
dbads = new JsonDB("./db/cmsad", true, false),
dbheaders = new JsonDB("./db/cmsheaders", true, false),
dbcontents = new JsonDB("./db/cmscontents", true, false),
dbcontentsad = new JsonDB("./db/cmscontentsad", true, false);

var comfunc = {
  UrlEngine: function (id,langid)
  {
    dbcontents.reload();
    dbheaders.reload();
    dbads.reload();
    dbcontentsad.reload();

   var strHtml="UrlEngine - BodyID error :"+id;
 
   var result = dbcontents.getData("/").findIndex(item => item.Id === id );
    if (result > -1) {
      var objContent=dbcontents.getData("/"+result);
      // read html
      strHtml = fs.readFileSync("./views/" +objContent.FileLayout + ".edge", 'utf8');
      // read header
      var result = dbheaders.getData("/").findIndex(item => item.Id === objContent.HeadId );
      if (result > -1) {
        var objHeader=dbheaders.getData("/"+result);
        strHtml=strHtml.replace("@!Title",objHeader.Title).replace("@!Desc",objHeader.MetaDesc).replace("@!section('HeaderScript')",window.atob(objHeader.HeaderScript)).replace("@!section('BodyScript')",window.atob(objHeader.BodyScript)).replace("@!section('FooterScript')",window.atob(objHeader.FooterScript));        
      }  
       
      // ads
      var filteredCAd = dbcontentsad.getData("/").filter(function (value) { return value.HeadId === objContent.id && value.Mode === "A" ; });
      filteredCAd.forEach(function(item){
          // search one ad
          var adHtml="";
          var filterads = dbads.getData("/").filter(function (value) { return value.GroupID === item.GroupID && value.lang === langid ; });
          if (filterads.length>1)
          {
            var adelement=0;
            if (filterads.length>2)
              adelement=Math.floor(Math.random() * filterads.length-1);
            adHtml=window.atob(filterads[adelement].AdvertJS);
          }
          strHtml=strHtml.replace("@!section('"+item.Section+"')",adHtml);
      });
                
      // moduls
      var filteredCAd = dbcontentsad.getData("/").filter(function (value) { return value.HeadId === objContent.id && value.Mode === "M" ; });
      filteredCAd.forEach(function(item){

      });
    }    

   return strHtml;
  },
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
        var id = Math.random().toString(36);
        if (str3.substr(0, 3).toLowerCase() == "ad_")
          indices.push({ "Id": id, "HeadId": HeadId, "Mode": "A", "Section": str3, "GroupID": "None", "Data": "" });
        if (str3.substr(0, 4).toLowerCase() == "mod_")
          indices.push({ "Id": id, "HeadId": HeadId, "Mode": "M", "Section": str3, "GroupID": "None", "Data": "" });
      }
    });

    return indices;

  },
  FileList: function () {
    return glob.sync("./views/*.edge");
  }
};

module.exports = comfunc;