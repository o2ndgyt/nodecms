var fs = require('fs-extra'),
  uuidv4 = require('uuid/v4'),
  comfunc = require(`${__base}app/comfunc.js`),
  { Certificate } = require('@fidm/x509'),
  _ = require('lodash'),
  cmsmodulread = require(`${__base}/app/modules/cmsmodul.read.js`),
  cmsmodulupdate = require(`${__base}app/modules/cmsmodul.update.js`),
  JsonDB = require('node-json-db'),
  dbads = new JsonDB(`${__base}db/cmsad`, true, false),
  dbtemplates = new JsonDB(`${__base}db/cmstemplates`, true, false),
  dblangs = new JsonDB(`${__base}db/cmslangs`, true, false),
  dbheaders = new JsonDB(`${__base}db/cmsheaders`, true, false),
  dbrouters = new JsonDB(`${__base}db/cmsrouters`, true, false),
  dbroutersad = new JsonDB(`${__base}db/cmsroutersad`, true, false),
  dburls = new JsonDB(`${__base}db/cmsurls`, true, false),
  dbmoduls = new JsonDB(`${__base}db/cmsmoduls`, true, false),
  dbwebsites = new JsonDB(`${__base}db/cmswebsites`, true, false);

var _strDefaultWebsite = fs.readFileSync(`${__base}db/defaultwebsite.txt`, "utf8");


var dbfunc = {
  File_SaveModul: function (req, res) {
    try {
      dbmoduls.reload();
      var result = dbmoduls.getData("/").findIndex(item => item.Id === req.params.id);
      if (result > -1) {
        var adatmodul = cmsmodulupdate[req.params.modul](req.body.filecon);
        var data = dbmoduls.getData("/" + result);
        data.Data = adatmodul;
        dbmoduls.push("/" + result, data);
      }
      res.redirect('/admin/Moduls');
    }
    catch (err) { console.log(err); }
    res.redirect('/admin/Moduls');
  },
  File_ReadModul: function (id, req, res) {
    try {
      dbmoduls.reload();
      data = _.find(dbmoduls.getData("/"), { 'Id': id });

      var convertdata = cmsmodulread[data.Modul](data.Data);

      res.render('admin/moduls/' + data.Modul, {
        id: req.params.id,
        data: convertdata,
        alias: data.Alias,
        modul: data.Modul,
        csrfToken: req.csrfToken()
      });
    }
    catch (err) { console.log(err); }
  },
  File_DeleteModule: function () {
    try {
      dbmoduls.reload();
      var addata = dbmoduls.getData("/");
      var result = addata.findIndex(item => item.Id === id);
      if (result > -1) {
        addata.splice(result, 1);
        dbmoduls.push("/", addata);
        return { values: id };
      } else {
        return { Message: "Data does not exist. Refresh page", status: 500 };
      }
    }
    catch (err) { console.log(err); }
  },
  File_UpdateModule: function (id, data) {
    try {
      dbmoduls.reload();
      var result = dbmoduls.getData("/").findIndex(item => item.Id === id);
      if (result > -1) {
        data.Id = id;
        dbmoduls.push("/" + result, data);
        return { values: data };
      } else {
        return { Message: "Data does not exist. Refresh page", status: 500 };
      }
    }
    catch (err) { console.log(err); }
  },
  File_PostModul: function (data) {
    try {
      dbmoduls.reload();
      var adsdata = dbmoduls.getData("/");
      data.Id = uuidv4();
      dbmoduls.push("/" + adsdata.length, data, false);
      return { values: data };
    }
    catch (err) { console.log(err); }
  },
  File_ListModuls: function () {
    try {
      dbmoduls.reload();
      var adsdata = dbmoduls.getData("/");
      return { "totalCount": adsdata.length, "items": adsdata };
    }
    catch (err) { console.log(err); }
    return { "totalCount": 0, "items": [] };
  },
  File_DeleteUrl: function (id) {
    try {
      dburls.reload();
      var addata = dburls.getData("/");
      var result = addata.findIndex(item => item.Id === id);
      if (result > -1) {
        addata.splice(result, 1);
        dburls.push("/", addata);
        return { values: id };
      } else {
        return { Message: "Data does not exist. Refresh page", status: 500 };
      }
    }
    catch (err) { console.log(err); }
  },
  File_UpdateUrl: function (id, data) {
    try {
      dburls.reload();
      var comfunc = require(`${__base}app/comfunc.js`);
      var result = dburls.getData("/").findIndex(item => item.Id === id);
      if (result > -1) {
        data.Id = id;
        data.Website = comfunc.GetWebsite(data.RouterId);
        dburls.push("/" + result, data);
        return { values: data };
      } else {
        return { Message: "Data does not exist. Refresh page", status: 500 };
      }
    }
    catch (err) { console.log(err); }
  },
  File_PostUrl: function (data) {
    try {
      dburls.reload();
      var comfunc = require(`${__base}app/comfunc.js`);
      var adsdata = dburls.getData("/");
      data.Id = uuidv4();
      data.Website = comfunc.GetWebsite(data.RouterId);
      dburls.push("/" + adsdata.length, data, false);
      return { values: data };
    }
    catch (err) { console.log(err); }
  },
  File_ListUrls: function () {
    try {
      dburls.reload();
      var adsdata = dburls.getData("/");
      return { "totalCount": adsdata.length, "items": adsdata };
    }
    catch (err) { console.log(err); }
    return { "totalCount": 0, "items": [] };
  },
  File_DeleteRouter: function (id) {
    try {
      dbrouters.reload();
      var addata = dbrouters.getData("/");
      var result = addata.findIndex(item => item.Id === id);
      if (result > -1) {
        addata.splice(result, 1);
        dbrouters.push("/", addata);
        dbroutersad.reload();
        var addataAds = dbroutersad.getData("/");
        var filtered = addataAds.filter(function (value) { return value.HeadId != id; });

        dbroutersad.push("/", filtered);

        return { values: id };
      } else {
        return { Message: "Data does not exist. Refresh page", status: 500 };
      }
    }
    catch (err) { console.log(err); }
  },
  File_UpdateRouter: function (id, data) {
    try {
      dbrouters.reload();
      dbroutersad.reload();
      var comfunc = require(`${__base}app/comfunc.js`);
      var addata = dbrouters.getData("/");
      var result = addata.findIndex(item => item.Id === id);
      if (result > -1) {
        var element = dbrouters.getData("/" + result)
        data.Id = id;
        dbrouters.push("/" + result, data);

        // change template
        if (element.TemplateId != data.TemplateId) {
          // delete old data
          var addataAds = dbroutersad.getData("/");
          var filtered = addataAds.filter(function (value) { return value.HeadId != id; });
          dbroutersad.push("/", filtered);

          // add new template
          var adsections = comfunc.GetSections(data.TemplateId, data.Id);
          dbroutersad.reload();
          var adsdataad = dbroutersad.getData("/");
          adsections.forEach(function (value) {
            dbroutersad.push("/" + adsdataad.length, value, false);
          });

        }

        return { values: data };
      } else {
        return { Message: "Data does not exist. Refresh page", status: 500 };
      }
    }
    catch (err) { console.log(err); }
  },
  File_PostRouter: function (data) {
    try {
      dbrouters.reload();
      var comfunc = require(`${__base}app/comfunc.js`);
      var adsdata = dbrouters.getData("/");
      data.Id = uuidv4();
      dbrouters.push("/" + adsdata.length, data, false);
      var adsections = comfunc.GetSections(data.TemplateId, data.Id);
      dbroutersad.reload();
      var adsdataad = dbroutersad.getData("/");
      adsections.forEach(function (value) {
        dbroutersad.push("/" + adsdataad.length, value, false);
      });
      return { values: data };
    }
    catch (err) { console.log(err); }
  },
  File_ListExtModulGroups: function () {
    try {
      dbmoduls.reload();
      var grouped = _.groupBy(dbmoduls.getData("/"), ad => ad.GroupID.trim());

      var tmp = [{ "Id": "@", "Group": "---" }];
      _.forEach(Object.keys(grouped), function (value) {
        tmp.push({ "Id": value.trim(), "Group": value.trim() });
      });
      return tmp;
    }
    catch (err) { console.log(err); }
    return [];
  },
  File_ListExtAdGroups: function () {
    try {
      dbads.reload();
      var grouped = _.groupBy(dbads.getData("/"), ad => ad.GroupID.trim());

      var tmp = [{ "Id": "@", "Group": "---" }];
      _.forEach(Object.keys(grouped), function (value) {
        tmp.push({ "Id": value.trim(), "Group": value.trim() });
      });

      return tmp;
    }
    catch (err) { console.log(err); }
    return [];
  },
  File_ListExtTemplates: function () {
    try {
      dbwebsites.reload();
      var dbweb = dbwebsites.getData("/");
      dbtemplates.reload();
      var data = dbtemplates.getData("/");
      var indices = [];
      data.forEach(function (element) {
        var result = dbweb.findIndex(item => item.Id === element.WebsiteId);
        var website = "";
        if (result > -1) {
          website = " (" + dbwebsites.getData("/" + result).Website + ")";
        }
        indices.push({ "Id": element.Id, "Alias": element.Alias + website });
      });
      return indices;
    }
    catch (err) { console.log(err); }
    return [];
  },
  File_ListExtHeaders: function () {
    try {
      dbwebsites.reload();
      var dbweb = dbwebsites.getData("/");
      dbheaders.reload();
      var data = dbheaders.getData("/");
      var indices = [];
      data.forEach(function (element) {
        var result = dbweb.findIndex(item => item.Id === element.WebsiteId);
        var website = "";
        if (result > -1) {
          website = " (" + dbwebsites.getData("/" + result).Website + ")";
        }
        indices.push({ "Id": element.Id, "Alias": element.Alias + website });
      });
      return indices;
    }
    catch (err) { console.log(err); }
    return [];
  },
  File_ListRouters: function (id) {
    try {
      dbrouters.reload();
      var adsdata = dbrouters.getData("/");
      return id == 2 ? adsdata : { "totalCount": adsdata.length, "items": adsdata };
    }
    catch (err) { console.log(err); }
    return id == 2 ? [] : { "totalCount": 0, "items": [] };
  },
  File_UpdateRoutersAds: function (id, data) {
    try {
      dbroutersad.reload();
      var addata = dbroutersad.getData("/");
      var result = addata.findIndex(item => item.Id === id);
      if (result > -1)
        dbroutersad.push("/" + result, data);
    }
    catch (err) { console.log(err); }
    return { values: data };
  },
  File_ListRoutersAds: function (id, mode) {
    try {
      dbroutersad.reload();
      var adsdata = dbroutersad.getData("/");
      var filtered = adsdata.filter(function (value) { return value.Mode == mode && value.HeadId == id; });
      return { "totalCount": filtered.length, "items": filtered };
    }
    catch (err) { console.log(err); }
    return { "totalCount": 0, "items": [] };
  },
  File_SaveTemplates: function (id, data, res) {

    try {
      dbtemplates.reload();
      var comfunc = require(`${__base}app/comfunc.js`);
      var result = dbtemplates.getData("/").findIndex(item => item.Id === id);
      if (result > -1) {
        var element = dbtemplates.getData("/" + result)
        element.HTML = comfunc.A2B(data.filecon);
        dbtemplates.push("/" + result, element);
      }
    }
    catch (err) { console.log(err); }
    res.redirect('/admin/Templates');
  },
  File_ReadTemplates: function (id, res, req) {

    try {
      dbtemplates.reload();
      var comfunc = require(`${__base}app/comfunc.js`);
      var addata = dbtemplates.getData("/");
      var result = addata.findIndex(item => item.Id === id);
      if (result > -1) {
        var element = dbtemplates.getData("/" + result)
        res.render('admin/templateEdit', {
          title: element.Alias,
          filecon: comfunc.B2A(element.HTML),
          id: element.Id,
          csrfToken: req.csrfToken()
        });
      }
      else {
        res.redirect("admin/Templates");
      }
    }
    catch (err) { console.log(err); res.redirect("admin/Templates"); }
  },
  File_DeleteTemplates: function (id) {
    try {
      dbtemplates.reload();
      var addata = dbtemplates.getData("/");
      var result = addata.findIndex(item => item.Id === id);
      if (result > -1) {
        addata.splice(result, 1);
        dbtemplates.push("/", addata);
        return { values: req.params.id };
        // todo delete all from other db
      } else {
        return { Message: "Data does not exist. Refresh page", status: 500 };
      }
    }
    catch (err) { console.log(err); }
  },
  File_UpdateTemplates: function (id, data) {
    try {
      dbtemplates.reload();
      var result = dbtemplates.getData("/").findIndex(item => item.Id === id);
      if (result > -1) {
        var element = dbtemplates.getData("/" + result)
        element.Alias = data.Alias;
        dbtemplates.push("/" + result, element);
        return { values: element };
      } else {
        return { Message: "Data does not exist. Refresh page", status: 500 };
      }
    }
    catch (err) { console.log(err); }

  },
  File_PostTemplates: function (data) {
    try {
      dbtemplates.reload();
      var comfunc = require(`${__base}app/comfunc.js`);
      var adsdata = dbtemplates.getData("/");
      data.Id = uuidv4();
      data.HTML = comfunc.A2B(_strDefaultWebsite);
      dbtemplates.push("/" + adsdata.length, data, false);
      return { values: data };
    }
    catch (err) { console.log(err); }
  },
  File_ListTemplates: function () {
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
        return { Message: "Data does not exist. Refresh page", status: 500 };
      }
    }
    catch (err) { console.log(err); }
  },
  File_UpdateAds: function (id, data) {
    try {
      dbads.reload();
      var comfunc = require(`${__base}app/comfunc.js`);
      var result = dbads.getData("/").findIndex(item => item.Id === id);
      if (result > -1) {
        data.Id = id;
        data.AdvertJS = comfunc.A2B(data.AdvertJS);
        dbads.push("/" + result, data);
        return { values: data };
      } else {
        return { Message: "Data does not exist. Refresh page", status: 500 };
      }
    }
    catch (err) { console.log(err); }
  },
  File_PostAds: function (data) {
    try {
      dbads.reload();
      var comfunc = require(`${__base}app/comfunc.js`);
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
        return { Message: "Data does not exist. Refresh page", status: 500 };
      }
    }
    catch (err) { console.log(err); }
  },
  File_UpdateHeaders: function (id, data) {
    try {
      dbheaders.reload();
      var comfunc = require(`${__base}app/comfunc.js`);
      var result = dbheaders.getData("/").findIndex(item => item.Id === id);
      if (result > -1) {
        data.Id = id;
        data.HeaderScript = comfunc.A2B(data.HeaderScript);
        data.BodyScript = comfunc.A2B(data.BodyScript);
        data.FooterScript = comfunc.A2B(data.FooterScript);

        dbheaders.push("/" + result, data);
        return { values: data };
      } else {
        return { Message: "Data does not exist. Refresh page", status: 500 };
      }

    }
    catch (err) { console.log(err); }
  },
  File_PostHeaders: function (data) {
    try {
      dbheaders.reload();
      var comfunc = require(`${__base}app/comfunc.js`);
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
      var addata = dbwebsites.getData("/");
      var result = addata.findIndex(item => item.Id === id);
      if (result > -1) {
        addata.splice(result, 1);
        dbwebsites.push("/", addata);
        return { values: id };
      } else {
        return { Message: "Data does not exist. Refresh page", status: 500 };
      }
    }
    catch (err) { console.log(err); }
  },
  File_UpdateWebsites: function (id, data) {
    try {
      dbwebsites.reload();
      var comfunc = require(`${__base}app/comfunc.js`);
      var addata = dbwebsites.getData("/");
      // Is same port than others ?
      if (data.Port > 0) {
        var result = addata.findIndex(item => item.Port === data.Port);
        if (result > -1) {
          return { Message: "This port already used. Use other port", status: 500 };
        }
      }

      var result = addata.findIndex(item => item.Id === id);
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
        return { Message: "Data does not exist. Refresh page", status: 500 };
      }
    }
    catch (err) { console.log(err); }
  },
  File_ListWebsites: function (id) {
    try {
      dbwebsites.reload();
      var adsdata = dbwebsites.getData("/");
      return id == '2' ? adsdata : { "totalCount": adsdata.length, "items": adsdata }
    }
    catch (err) { console.log(err); }
    return { "totalCount": 0, "items": [] };
  },
  File_PostWebsites: function (data) {
    try {
      dbwebsites.reload();
      var addata = dbwebsites.getData("/");

      // Is same port than others ?
      if (data.Port > 0) {
        var result = addata.findIndex(item => item.Port === data.Port);
        if (result > -1) {
          return { Message: "This port already used. Use other port", status: 500 };
        }
      }

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
        return { Message: "Data does not exist. Refresh page", status: 500 };
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
        return { Message: "Data does not exist. Refresh page", status: 500 };
      }
    }
    catch (err) { console.log(err); }

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
  File_GetWebsiteId: function (website) {
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
      var result = dburls.getData("/").findIndex(item => item.Type == strType && item.PageFullUrl == strUrl && item.Website == strHostname && (item.LangId == strLangId || item.LangId == "*"));
      if (result > -1)
        return dburls.getData("/" + result);
    }
    catch (err) { console.log(err); }

    return "*";
  },
  File_GetHtml: function (RouterId) {
    try {
      dbrouters.reload();
      var result = dbrouters.getData("/").findIndex(item => item.Id == RouterId);
      if (result > -1) {
        dbtemplates.reload();
        var comfunc = require(`${__base}app/comfunc.js`);
        var result = dbtemplates.getData("/").findIndex(item => item.Id == dbrouters.getData("/" + result).TemplateId);
        if (result > -1)
          return comfunc.B2A(dbtemplates.getData("/" + result).HTML);
      }
    }
    catch (err) { console.log(err); }

    return "*";
  },
  File_GetHeader: function (RouterId, strHtml) {
    try {
      dbrouters.reload();
      var result = dbrouters.getData("/").findIndex(item => item.Id == RouterId);
      if (result > -1) {
        dbheaders.reload();
        var comfunc = require(`${__base}app/comfunc.js`);
        var result = dbheaders.getData("/").findIndex(item => item.Id == dbrouters.getData("/" + result).HeadId);
        if (result > -1) {
          var objHeader = dbheaders.getData("/" + result);
          strHtml = strHtml.replace("@!Title", objHeader.Title).replace("@!Desc", objHeader.MetaDesc).replace("@!section('HeaderScript')", comfunc.B2A(objHeader.HeaderScript)).replace("@!section('BodyScript')", comfunc.B2A(objHeader.BodyScript)).replace("@!section('FooterScript')", comfunc.B2A(objHeader.FooterScript));
        }
      }
    }
    catch (err) { console.log(err); }

    return strHtml;
  },
  File_GetAds: function (strHeadId, strHtml, strWebsiteId, strFireWall) {

    try {
      dbroutersad.reload();
      dbads.reload();
      var comfunc = require(`${__base}app/comfunc.js`);
      var filteredCAd = dbroutersad.getData("/").filter(function (value) { return value.HeadId === strHeadId && value.Mode === "A"; });
      filteredCAd.forEach(function (item) {
        var adHtml = "";
        var Filters = [strFireWall, "*"];
        var filterads = dbads.getData("/").filter(function (value) { return value.Access.some(g => Filters.includes(g)) && value.GroupID === item.GroupId && value.WebsiteId == strWebsiteId; });
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
        var Filters = [strFireWall, "*"];
        var filterads = dbmoduls.getData("/").filter(function (value) { return value.GroupID === item.GroupId && value.Access.some(g => Filters.includes(g)); });
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