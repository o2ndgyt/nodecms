var comfunc = require(`${__base}app/comfunc.js`),
  cmsmodulread = require(`${__base}/app/modules/cmsmodul.read.js`),
  JsonDB = require('node-json-db'),
  dbads = new JsonDB(`${__base}/db/cmsad`, true, false),
  dbheaders = new JsonDB(`${__base}/db/cmsheaders`, true, false),
  dbmoduls = new JsonDB(`${__base}/db/cmsmoduls`, true, false),
  dbroutersad = new JsonDB(`${__base}/db/cmsroutersad`, true, false),
  dbtemplates = new JsonDB(`${__base}/db/cmstemplates`, true, false),
  dbwebsites = new JsonDB(`${__base}/db/cmswebsites`, true, false),
  dburls = new JsonDB(`${__base}db/cmsurls`, true, false),
  db = new JsonDB(`${__base}/db/config`, true, false);

var dbfunc = {
  File_GetWebsite: function (website) {
    try {
      dbwebsites.reload();
      var result = dbwebsites.getData("/").findIndex(item => item.Website === website);
      if (result > -1)
        return dbwebsites.getData("/" + result).Id;
    }
    catch (err) { console.log(err); }

    return "*";
  },
  File_GetLangId: function (strLang) {
    try {
      dblangs.reload();
      var result = dblangs.getData("/").findIndex(item => item.Code === strLang);
      if (result > -1)
        return dblangs.getData("/" + result).Id;
    }
    catch (err) { console.log(err); }

    return "*";
  },
  File_GetRouterId: function (strLangId, strUrl, strHostname) {
    try {
      dburls.reload();
      var strType = strUrl == "/" ? "H" : strUrl !="404" ? "P":"404";
      var result = dburls.getData("/").findIndex(item => item.Type == strType && item.PageFullUrl == strUrl && item.LangId == strLangId && item.Website == strHostname);
      if (result > -1)
        return dburls.getData("/" + result);
    }
    catch (err) { console.log(err); }

    return "*";
  },
  File_GetHtml: function (TemplateId) {
    try {
      dbtemplates.reload();
      var result = dbtemplates.getData("/").findIndex(item => item.Id == TemplateId);
      if (result > -1)
        return comfunc.B2A(dbtemplates.getData("/" + result).HTML);
    }
    catch (err) { console.log(err); }

    return "*";
  },
  File_GetHeader: function (HeadId, strHtml) {
    try {
      ddbheaders.reload();
      var result = dbheaders.getData("/").findIndex(item => item.Id == HeadId);
      if (result > -1) {
        var objHeader = dbheaders.getData("/" + result);
        strHtml = strHtml.replace("@!Title", objHeader.Title).replace("@!Desc", objHeader.MetaDesc).replace("@!section('HeaderScript')", comfunc.B2A(objHeader.HeaderScript)).replace("@!section('BodyScript')", comfunc.B2A(objHeader.BodyScript)).replace("@!section('FooterScript')", comfunc.B2A(objHeader.FooterScript));
      }
    }
    catch (err) { console.log(err); }

    return strHtml;
  },
  File_GetAds: function (strHeadId, strHtml, strWebsiteId, strFireWall) {

    try {
      dbroutersad.reload();
      dbads.reload();
      var filteredCAd = dbroutersad.getData("/").filter(function (value) { return value.HeadId === strHeadId && value.Mode === "A"; });
      filteredCAd.forEach(function (item) {
        var adHtml = "";
        var filterads = dbads.getData("/").filter(function (value) { return value.GroupID === item.GroupId && value.WebsiteId == strWebsiteId && item.Access.find(element => element == strFireWall || element == "*"); });
        if (filterads.length > 0) {
          var adelement = 0;
          if (filterads.length > 1)
            adelement = Math.floor(Math.random() * filterads.length - 1);
          adHtml = comfunc.B2A(filterads[adelement].AdvertJS);
        }
        strHtml = strHtml.replace("@!section('" + item.Section + "')", adHtml);
      });
    }
    catch (err) { console.log(err); }

    return strHtml;
  },
  File_GetModuls: function (strHeadId, strHtml, strFireWall) {
    try {

      dbroutersad.reload();
      dbmoduls.reload();
      var filteredCAd = dbroutersad.getData("/").filter(function (value) { return value.HeadId === strHeadId && value.Mode === "M"; });
      filteredCAd.forEach(function (item) {
        var adHtml = "";
        var filterads = dbmoduls.getData("/").filter(function (value) { return value.GroupID === item.GroupId && item.Access.find(element => element == strFireWall || element == "*"); });
        if (filterads.length > 0) {
          var adelement = 0;
          if (filterads.length > 1)
            adelement = Math.floor(Math.random() * filterads.length - 1);

          var objModul = filterads[adelement];
          adHtml = cmsmodulread[objModul.Modul](objModul.Data);
        }
        strHtml = strHtml.replace("@!section('" + item.Section + "')", adHtml);
      });

    }
    catch (err) { console.log(err); }

    return strHtml;
  }
};

module.exports = dbfunc;