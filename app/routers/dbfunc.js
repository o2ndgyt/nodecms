var  comfunc = require(`${__base}app/comfunc.js`), 
  JsonDB = require('node-json-db'),
  dbads = new JsonDB(`${__base}/db/cmsad`, true, false),
  dbheaders = new JsonDB(`${__base}/db/cmsheaders`, true, false),
  dbrouters = new JsonDB(`${__base}/db/cmsrouters`, true, false),
  dbroutersad = new JsonDB(`${__base}/db/cmsroutersad`, true, false),
  dbtemplates = new JsonDB(`${__base}/db/cmstemplates`, true, false),
  dbwebsites = new JsonDB(`${__base}/db/cmswebsites`, true, false),
  dburls = new JsonDB(`${__base}db/cmsurls`, true, false),
  db = new JsonDB(`${__base}/db/config`, true, false);

  var configdata = db.getData("/");

  var dbfunc = {
    GetWebsite : function (website)
    {
      if (configdata.DB === "File" )
      {
        dbwebsites.reload();
        var result = dbwebsites.getData("/").findIndex(item => item.Website === website);
        if (result > -1) 
             return dbwebsites.getData("/" + result).Id; 
      }
      else
      { 
        
      }
      
      return "*";
    },
    GetLangId : function (strLang)
    { 
      if (configdata.DB === "File" )
      {
        dblangs.reload();
        var result = dblangs.getData("/").findIndex(item => item.Code === strLang);
        if (result > -1) 
             return dblangs.getData("/" + result).Id;        
      }
      else
      { 
        
      }
      return "*";
    },
    GetRouterId: function (strLangId,strUrl,strHostname)
    { 
      if (configdata.DB === "File" )
      {
        dburls.reload();
        var strType = strUrl == "/" ? "H":"P";
        var result = dburls.getData("/").findIndex(item => item.Type == strType && item.PageFullUrl == strUrl && item.LangId == strLangId && item.Website == strHostname );
        if (result > -1)    
           return dburls.getData("/" + result);   
      }
      else
      { 
        
      }
      return "*";
    },
    GetHtml: function (TemplateId)
    { 
      if (configdata.DB === "File" )
      {
        dbtemplates.reload();
        var result = dbtemplates.getData("/").findIndex(item =>  item.Id == TemplateId );
        if (result > -1) 
           return  comfunc.B2A(dbtemplates.getData("/" + result).HTML);   
      }
      else
      { 
        
      }
      return "*";
    },
    GetHeader: function (HeadId,strHtml)
    { 
      if (configdata.DB === "File" )
      {
        ddbheaders.reload();
        var result = dbheaders.getData("/").findIndex(item =>  item.Id == HeadId );
        if (result > -1) 
          {
            var objHeader = dbheaders.getData("/" + result);
            strHtml = strHtml.replace("@!Title", objHeader.Title).replace("@!Desc", objHeader.MetaDesc).replace("@!section('HeaderScript')", comfunc.B2A(objHeader.HeaderScript)).replace("@!section('BodyScript')", comfunc.B2A(objHeader.BodyScript)).replace("@!section('FooterScript')", comfunc.B2A(objHeader.FooterScript));    
          } 
      }
      else
      { 
        
      }
      return strHtml;
    },
    GetAds: function (strHeadId,strHtml,strWebsiteId,strFireWall)
    { 
      if (configdata.DB === "File" )
      {
        dbroutersad.reload();
        dbads.reload();
      var filteredCAd = dbroutersad.getData("/").filter(function (value) { return value.HeadId === strHeadId && value.Mode === "A"; });
      filteredCAd.forEach(function (item) {
        // search one ad
        var adHtml = "";
        var filterads = dbads.getData("/").filter(function (value) { return value.GroupID === item.GroupId && value.WebsiteId == strWebsiteId && item.Access.find(element=> element == strFireWall || element == "*"); });
        if (filterads.length > 0) {
          var adelement = 0;
          if (filterads.length > 1)
            adelement = Math.floor(Math.random() * filterads.length - 1);
          adHtml = comfunc.B2A(filterads[adelement].AdvertJS);
        }
        strHtml = strHtml.replace("@!section('" + item.Section + "')", adHtml);
      });




      }
      else
      { 
        
      }
      return strHtml;
    }
  };
  
  module.exports = dbfunc;