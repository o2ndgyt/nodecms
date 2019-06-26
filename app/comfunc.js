var fs = require('fs-extra'),
glob = require('glob'),
cmsmodulread = require('./modules/cmsmodul.read.js'),
JsonDB=require('node-json-db'),
dbads = new JsonDB("./db/cmsad", true, false),
dbheaders = new JsonDB("./db/cmsheaders", true, false),
dbcontents = new JsonDB("./db/cmscontents", true, false),
dbcontentsad = new JsonDB("./db/cmscontentsad", true, false);

const uuidv4 = require('uuid/v4');

var comfunc = {
  B2A: function (data){
    if (data != "")
      return Buffer.from(data, 'base64').toString('ascii');
    return "";
  },
  UrlEngine: function (id,langid)
  {
    dbcontents.reload();
    dbheaders.reload();
    dbads.reload();
    dbcontentsad.reload();

   var strHtml=`UrlEngine BodyID error:${id} lang id:${langid} `;
 
   var result = dbcontents.getData("/").findIndex(item => item.Id === id );
    if (result > -1) {
      var objContent=dbcontents.getData("/"+result);
      // read html
      strHtml = fs.readFileSync("./views/" +objContent.FileLayout + ".edge", 'utf8');
      // read header
      var result = dbheaders.getData("/").findIndex(item => item.Id === objContent.HeadId );
      if (result > -1) {
        var objHeader=dbheaders.getData("/"+result);
        strHtml=strHtml.replace("@!Title",objHeader.Title).replace("@!Desc",objHeader.MetaDesc).replace("@!section('HeaderScript')",comfunc.B2A(objHeader.HeaderScript)).replace("@!section('BodyScript')",comfunc.B2A(objHeader.BodyScript)).replace("@!section('FooterScript')",comfunc.B2A(objHeader.FooterScript));        
      }  
       
      // ads
      var filteredCAd =dbcontentsad.getData("/").filter(function (value) { return value.HeadId === objContent.Id && value.Mode === "A" ; });
      filteredCAd.forEach(function(item){
          // search one ad
          var adHtml="";
          var filterads = dbads.getData("/").filter(function (value) { return value.GroupID === item.GroupID && (value.lang === langid || value.lang === "*"); });
          if (filterads.length>0)
          {
            var adelement=0;
            if (filterads.length>1)
              adelement=Math.floor(Math.random() * filterads.length-1);
            adHtml=comfunc.B2A(filterads[adelement].AdvertJS);
          }
          strHtml=strHtml.replace("@!section('"+item.Section+"')",adHtml);
      });
                
      // moduls
      var filteredCMo = dbcontentsad.getData("/").filter(function (value) { return value.HeadId === objContent.Id && value.Mode === "M" ; });
      filteredCMo.forEach(function(item){
          // call read fn to convert data
          if (item.GroupID != "None")
          {
          var strModul = cmsmodulread[item.GroupID](item.Data);
          strHtml=strHtml.replace("@!section('"+item.Section+"')",strModul);
          }
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
        var id = uuidv4();
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