var uuidv4 = require('uuid/v4'),
  comfunc = require(`${__base}app/comfunc.js`),
  { Certificate } = require('@fidm/x509'),
  cmsmodulread = require(`${__base}/app/modules/cmsmodul.read.js`),
  JsonDB = require('node-json-db'),
  dbads = new JsonDB(`${__base}/db/cmsad`, true, false),
  dblangs = new JsonDB(`${__base}db/cmslangs`, true, false),
  dbheaders = new JsonDB(`${__base}/db/cmsheaders`, true, false),
  dbmoduls = new JsonDB(`${__base}/db/cmsmoduls`, true, false),
  dbroutersad = new JsonDB(`${__base}/db/cmsroutersad`, true, false),
  dbtemplates = new JsonDB(`${__base}/db/cmstemplates`, true, false),
  dbwebsites = new JsonDB(`${__base}/db/cmswebsites`, true, false),
  dburls = new JsonDB(`${__base}db/cmsurls`, true, false),
  db = new JsonDB(`${__base}/db/config`, true, false);

var _strDefaultWebsite = "<html><title>@!Title</title><meta name=\"Description\" content=\"@!Desc\">\n<head>\n@!section('HeaderScript')\n</head>\n<body>\n@!section('BodyScript')\n<h1>\n@!section('ad#first')\n</h1>\n<h2>\n@!section('mod#first')\n</h2>\n@!section('FooterScript')\n</body>\n</html>";


var dbfunc = {
  File_UpdateWebsites: function (id,data)
  {try {
    dbtemplates.reload();
    var result = dbtemplates.getData("/").findIndex(item => item.Id === id);
    if (result > -1) {
        var element = dbtemplates.getData("/" + result)
        element.Alias = data.Alias;
        dbtemplates.push("/" + result, element);
        return { values: element };
    } else {
        return {
            // todo
            success: "Update Error. Refresh page",
            status: 500
        };
    } }
    catch (err) { console.log(err); }
  
  },
  File_PostWebsites: function (data)
  {
    try {
    dbtemplates.reload();
    var adsdata = dbtemplates.getData("/");
    data.Id = uuidv4();
    data.HTML = comfunc.A2B(_strDefaultWebsite);
    dbtemplates.push("/" + adsdata.length, data, false);
    return { values: data };
  }
  catch (err) { console.log(err); }


  },
  File_ListWebsites: function () {
    try {
      dbtemplates.reload();
      var adsdata = dbtemplates.getData("/");
      return { "totalCount": adsdata.length, "items": adsdata };
    }
    catch (err) { console.log(err); }
    return { "totalCount": 0, "items": [] };

  },
  File_DeleteAds: function (id) {
    try {
      dbads.reload();
      var addata = dbads.getData("/");
      var result = addata.findIndex(item => item.Id === id);
      if (result > -1) {
        addata.splice(result, 1);
        dbads.push("/", addata);
        return { values: id };
      } else {
        return {
          //todo
          success: "Delete error. Refresh page",
          status: 500
        };
      }
    }
    catch (err) { console.log(err); }
  },
  File_UpdateAds: function (id, data) {
    try {
      dbads.reload();
      var result = dbads.getData("/").findIndex(item => item.Id === id);
      if (result > -1) {
        data.Id = id;
        data.AdvertJS = comfunc.A2B(data.AdvertJS);
        dbads.push("/" + result, data);
        return { values: data };
      } else {
        //todo
        return {
          success: "Update Error. Refresh page",
          status: 500
        };
      }
    }
    catch (err) { console.log(err); }
  },
  File_PostAds: function (data) {
    try {
      dbads.reload();
      var adsdata = dbads.getData("/");
      data.Id = uuidv4();
      data.AdvertJS = comfunc.A2B(data.AdvertJS);
      dbads.push("/" + adsdata.length, data, false);
      return { values: data };
    }
    catch (err) { console.log(err); }
  },
  File_ListAds: function () {
    try {
      dbads.reload();
      var adsdata = dbads.getData("/");
      return { "totalCount": adsdata.length, "items": adsdata };
    }
    catch (err) { console.log(err); }
    return { "totalCount": 0, "items": [] };

  },
  File_DeleteHeaders: function (id) {
    try {
      dbheaders.reload();
      var addata = dbheaders.getData("/");
      var result = addata.findIndex(item => item.Id === id);
      if (result > -1) {
        addata.splice(result, 1);
        dbheaders.push("/", addata);
        return { values: id };
      } else {
        return {
          //todo
          success: "Delete error. Refresh page",
          status: 500
        };
      }
    }
    catch (err) { console.log(err); }
  },
  File_UpdateHeaders: function (id, data) {
    try {
      dbheaders.reload();
      var result = dbheaders.getData("/").findIndex(item => item.Id === id);
      if (result > -1) {
        data.Id = id;
        data.HeaderScript = comfunc.A2B(data.HeaderScript);
        data.BodyScript = comfunc.A2B(data).BodyScript);
        data.FooterScript = comfunc.A2B(data.FooterScript);

        dbheaders.push("/" + result, data);
        return { values: data };
      } else {
        //todo
        return {
          success: "Update Error. Refresh page",
          status: 500
        };
      }

    }
    catch (err) { console.log(err); }
  },
  File_PostHeaders: function (data) {
    try {
      dbheaders.reload();
      var adsdata = dbheaders.getData("/");
      data.Id = uuidv4();
      data.HeaderScript = comfunc.A2B(data.HeaderScript);
      data.BodyScript = comfunc.A2B(data.BodyScript);
      data.FooterScript = comfunc.A2B(data.FooterScript);
      dbheaders.push("/" + adsdata.length, data, false);
      return { values: data };
    }
    catch (err) { console.log(err); }
    return "";

  },
  File_ListHeaders: function () {
    try {
      dbheaders.reload();
      var adsdata = dbheaders.getData("/");
      return { "totalCount": adsdata.length, "items": adsdata };
    }
    catch (err) { console.log(err); }
    return { "totalCount": 0, "items": [] };
  },
  File_DeleteWebsites: function (id) {
    try {
      dbwebsites.reload();
      var addata = dblangs.getData("/");
      var result = addata.findIndex(item => item.Id === id);
      if (result > -1) {
        addata.splice(result, 1);
        dbwebsites.push("/", addata);
        return { values: id };
      } else {
        return {
          //todo
          success: "Delete error. Refresh page",
          status: 500
        };
      }
    }
    catch (err) { console.log(err); }
  },
  File_UpdateWebsites: function (id, data) {
    try {
      dbwebsites.reload();
      var result = dbwebsites.getData("/").findIndex(item => item.Id === id);
      if (result > -1) {
        data.Id = id;
        if (data.CER) {
          data.ValidFrom = Certificate.fromPEM(data.CER).validFrom;
          data.ValidTo = Certificate.fromPEM(data.CER).validTo;
          data.Active = comfunc.CerExpired(data.ValidFrom, data.ValidTo);
        }
        else {
          data.ValidFrom = "";
          data.ValidTo = "";
          data.Active = "";
        }
        dbwebsites.push("/" + result, data);
        return { values: data };
      } else {
        //todo
        return {
          success: "Update Error. Refresh page",
          status: 500
        };
      }
    }
    catch (err) { console.log(err); }
  },
  File_ListWebsites: function (id) {
    try {
      dbwebsites.reload();
      var adsdata = db.websites.getData("/");
      return id == '2' ? adsdata : { "totalCount": adsdata.length, "items": adsdata }
    }
    catch (err) { console.log(err); }
    return { "totalCount": 0, "items": [] };
  },
  File_PostWebsites: function (data) {
    try {
      dbwebsites.reload();
      var adsdata = dbwebsites.getData("/");
      data.Id = uuidv4();
      if (data.CER) {
        data.ValidFrom = Certificate.fromPEM(req.body.CER).validFrom;
        data.ValidTo = Certificate.fromPEM(req.body.CER).validTo;
        data.Active = comfunc.CerExpired(req.body.ValidFrom, req.body.ValidTo);
      }

      dbwebsites.push("/" + adsdata.length, data, false);
      return { values: data };
    }
    catch (err) { console.log(err); }
  },
  File_DeleteLangs: function (id) {
    try {
      dblangs.reload();
      var addata = dblangs.getData("/");
      var result = addata.findIndex(item => item.Id === id);
      if (result > -1) {
        addata.splice(result, 1);
        dblangs.push("/", addata);
        return { values: id };
      } else {
        return {
          //todo
          success: "Delete error. Refresh page",
          status: 500
        };
      }
    }
    catch (err) { console.log(err); }
    return [];
  },
  File_UpdateLangs: function (id, data) {
    try {
      dblangs.reload();
      var result = dblangs.getData("/").findIndex(item => item.Id === id);
      if (result > -1) {
        data.Id = id;
        dblangs.push("/" + result, data);
        return { values: data };
      } else {
        //todo
        return {
          success: "Update Error. Refresh page",
          status: 500
        };
      }
    }
    catch (err) { console.log(err); }
    return [];
  },
  File_ListLangs: function (id) {
    try {
      dblangs.reload();
      var adsdata = dblangs.getData("/");

      if (id == 2)
        adsdata.push({ Id: "*", Code: "*", Alias: "All" });
      return id == 2 ? adsdata : { "totalCount": adsdata.length, "items": adsdata }
    }
    catch (err) { console.log(err); }
    return id == 2 ? [] : { "totalCount": 0, "items": [] };
  },
  File_PostLangs: function (data) {
    try {
      dblangs.reload();
      var adsdata = dblangs.getData("/");
      data.Id = uuidv4();
      dblangs.push("/" + adsdata.length, data, false);
      return { values: data };
    }
    catch (err) { console.log(err); }
  },
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
      var strType = strUrl == "/" ? "H" : strUrl != "404" ? "P" : "404";
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