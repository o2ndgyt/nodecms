var express = require('express'),
    router = express.Router(),
    JsonDB = require('node-json-db'),
    _ = require('lodash'),
    { Certificate } = require('@fidm/x509'),
    csrf = require('csurf'),
    passport = require('passport'),
    uuidv4 = require('uuid/v4'),
    comfunc = require(`${__base}app/comfunc.js`),
    db = new JsonDB(`${__base}db/config`, true, false),
    dbads = new JsonDB(`${__base}db/cmsad`, true, false),
    dbtemplates = new JsonDB(`${__base}db/cmstemplates`, true, false),
    dblangs = new JsonDB(`${__base}db/cmslangs`, true, false),
    dbheaders = new JsonDB(`${__base}db/cmsheaders`, true, false),
    dbrouters = new JsonDB(`${__base}db/cmsrouters`, true, false),
    dbroutersad = new JsonDB(`${__base}db/cmsroutersad`, true, false),
    dburls = new JsonDB(`${__base}db/cmsurls`, true, false),
    dbmoduls = new JsonDB(`${__base}db/cmsmoduls`, true, false),
    dbwebsites = new JsonDB(`${__base}db/cmswebsites`, true, false),
    cmsmodulread = require(`${__base}app/modules/cmsmodul.read.js`),
    cmsmodulupdate = require(`${__base}app/modules/cmsmodul.update.js`);


var csrfProtecion = csrf();
router.use(csrfProtecion);

require(`${__base}app/passportlogin.js`);

// Is user login ?
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

function notLoggedIn(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/admin/Login');
}


router.get('/Login', function (req, res, next) {
    if (!req.isAuthenticated()) {
        var messages = req.flash('error');
        res.render('admin/login', { csrfToken: req.csrfToken(), messages: messages, hasErrors: messages.length > 0 });
    }
    else { res.redirect('/admin/Dashboard'); }
});

router.post('/Login', notLoggedIn, passport.authenticate('local.signin', {
    failureRedirect: '/admin/Login',
    failureFlash: true
}), function (req, res, next) {
    if (req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    }
    else {
        res.redirect('/admin/Dashboard');
    }
});



router.use('/', isLoggedIn, function (req, res, next) {
    next();
});


// Logout
//******************* */

router.get('/Logout', function (req, res) {
    req.logout();
    res.redirect('/');
});


// Dashboard
//**********************
router.get('/Dashboard', function (req, res) {
    res.render('admin/dashboard', { filedb: comfunc.GetDbSize(), csrfToken: req.csrfToken(),geoexp:comfunc.GeoExpired() });
});

// Database
//**********************
router.get('/DB', function (req, res) {
    db.reload();
    var configdata = db.getData("/");
    res.render('admin/database', { config: configdata, csrfToken: req.csrfToken() });
});

router.post('/DB', function (req, res) {
    var configdata = db.getData("/");
    configdata.DB = req.body.DB;
    configdata.MongoConn = req.body.MongoConn;
    db.push("/", configdata);
    res.json({
        success: "Settings saved",
        status: 200
    });
});

// Fiewall
//**********************
router.get('/Firewall', function (req, res) {
    db.reload();
    var configdata = db.getData("/");
    res.render('admin/firewall', { config: configdata, csrfToken: req.csrfToken(),ip: req.location.ip });
});

router.get('/Firewall/countries/:id', function (req, res) {
    var list = comfunc.CountriesList();
    if (req.params.id == '2')
        list.push({ name: 'All', code: '*' });
    res.json(list);
});

router.post('/Firewall', function (req, res) {
    var configdata = db.getData("/");
    configdata.WebBCo = req.body.WebBCo;
    configdata.AdminACo = req.body.AdminACo;
    configdata.WebBIPS = req.body.WebBIPS;
    configdata.AdminAIPS = req.body.AdminAIPS;
    db.push("/", configdata);
    res.json({
        success: "Settings saved",
        status: 200
    });
});


// Settings
//**********************
router.get('/Settings', function (req, res) {
    db.reload();
    var configdata = db.getData("/");
    res.render('admin/settings', { config: configdata, csrfToken: req.csrfToken() });
});

router.post('/Settings', function (req, res) {
    var configdata = db.getData("/");
    configdata.compress = req.body.compress;
    configdata.XPowerBy = req.body.XPowerBy;
    db.push("/", configdata);
    res.json({
        success: "Settings saved",
        status: 200
    });
});


// Change Pwd
//**********************
router.get('/ChangePwd', function (req, res) {
    db.reload();
    var configdata = db.getData("/");
    res.render('admin/changepwd', { config: configdata, csrfToken: req.csrfToken() });
});

router.post('/ChangePwd', function (req, res) {
    var configdata = db.getData("/");

    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (re.test(req.body.AdminUser) && req.body.AdminPWD.length>5)
      {
        configdata.AdminUser = req.body.AdminUser;
        configdata.AdminPWD = req.body.AdminPWD;
        db.push("/", configdata);
        res.json({
            success: "Login changed",
            status: 200
        });
    }
    else
    {
        res.json({
            success: "Invalid Email or too short password. Password is min 6 char",
            status: 500
        });
    }
});


// Langs CRUD
//**********************
router.get('/Langs', function (req, res) {
    res.render('admin/langs', { csrfToken: req.csrfToken() });
});


// Create
router.post('/Langs', function (req, res) {
    dblangs.reload();
    var adsdata = dblangs.getData("/");
    req.body.Id = uuidv4();
    dblangs.push("/" + adsdata.length, req.body, false);
    res.json({ values: req.body });
});

// Read
router.get('/Langs/list/:id', function (req, res) {
    dblangs.reload();
    var adsdata = dblangs.getData("/");
    if (req.params.id == 2)
    { 
        adsdata.push({Id:"*",Code:"*",Alias:"All"});
    }
    res.json(req.params.id == 2 ? adsdata : { "totalCount": adsdata.length, "items": adsdata });
});


// Update
router.post('/Langs/:id', function (req, res) {
    dblangs.reload();
    var result = dblangs.getData("/").findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        req.body.Id = req.params.id;
        dblangs.push("/" + result, req.body);
        res.json({ values: req.body });
    } else {
        //todo
        res.json({
            success: "Update Error. Refresh page",
            status: 500
        });
    }

});

// Delete
router.post('/Langs/d/:id', function (req, res) {
    dblangs.reload();
    var addata = dblangs.getData("/");
    var result = addata.findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        addata.splice(result, 1);
        dblangs.push("/", addata);
        res.json({ values: req.params.id });
    } else {
        res.json({
            //todo
            success: "Delete error. Refresh page",
            status: 500
        });
    }
});

router.get('/Restart', function (req, res) {
    process.on('SIGINT', function() {
     
          process.exit(1);
    
     });
});


// Websites CRUD
//**********************
router.get('/Websites', function (req, res) {
    res.render('admin/websites', { csrfToken: req.csrfToken() });
});


// Create
router.post('/Websites', function (req, res) {
    dbwebsites.reload();
    var adsdata = dbwebsites.getData("/");
    req.body.Id = uuidv4();
    req.body.ValidFrom=Certificate.fromPEM(req.body.CER).validFrom;
    req.body.ValidTo=Certificate.fromPEM(req.body.CER).validTo;
    req.body.Active=comfunc.CerExpired(req.body.ValidFrom,req.body.ValidTo);
    dbwebsites.push("/" + adsdata.length, req.body, false);
    res.json({ values: req.body });
});

// Read
router.get('/Websites/list/:id', function (req, res) {
    dbwebsites.reload();
    var adsdata = dbwebsites.getData("/");
    res.json(req.params.id == '2' ? adsdata : { "totalCount": adsdata.length, "items": adsdata });
});



// Update
router.post('/Websites/:id', function (req, res) {
    dbwebsites.reload();
    var result = dbwebsites.getData("/").findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        req.body.Id = req.params.id;
        req.body.ValidFrom=Certificate.fromPEM(req.body.CER).validFrom;
        req.body.ValidTo=Certificate.fromPEM(req.body.CER).validTo;   
        req.body.Active=comfunc.CerExpired(req.body.ValidFrom,req.body.ValidTo);       
        dbwebsites.push("/" + result, req.body);
        res.json({ values: req.body });
    } else {
        //todo
        res.json({
            success: "Update Error. Refresh page",
            status: 500
        });
    }

});

// Delete
router.post('/Websites/d/:id', function (req, res) {
    dbwebsites.reload();
    var addata = dblangs.getData("/");
    var result = addata.findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        addata.splice(result, 1);
        dbwebsites.push("/", addata);
        res.json({ values: req.params.id });
    } else {
        res.json({
            //todo
            success: "Delete error. Refresh page",
            status: 500
        });
    }
});


// Headers CRUD
//**********************

// Header
router.get('/Headers', function (req, res) {
    res.render('admin/headers', { csrfToken: req.csrfToken() });
});

// Read
router.get('/Headers/list', function (req, res) {
    dbheaders.reload();
    var adsdata = dbheaders.getData("/");
    res.json({ "totalCount": adsdata.length, "items": adsdata });
});

// Create
router.post('/Headers', function (req, res) {
    dbheaders.reload();
    var adsdata = dbheaders.getData("/");
    req.body.Id = uuidv4();
    req.body.HeaderScript = comfunc.A2B(req.body.HeaderScript);
    req.body.BodyScript = comfunc.A2B(req.body.BodyScript);
    req.body.FooterScript = comfunc.A2B(req.body.FooterScript);
    dbheaders.push("/" + adsdata.length, req.body, false);
    res.json({ values: req.body });
});



// Update
router.post('/Headers/:id', function (req, res) {
    dbheaders.reload();
    var result = dbheaders.getData("/").findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        req.body.Id = req.params.id;
        req.body.HeaderScript = comfunc.A2B(req.body.HeaderScript);
        req.body.BodyScript = comfunc.A2B(req.body.BodyScript);
        req.body.FooterScript = comfunc.A2B(req.body.FooterScript);

        dbheaders.push("/" + result, req.body);
        res.json({ values: req.body });
    } else {
        //todo
        res.json({
            success: "Update Error. Refresh page",
            status: 500
        });
    }

});

// Delete
router.post('/Headers/d/:id', function (req, res) {
    dbheaders.reload();
    var addata = dbheaders.getData("/");
    var result = addata.findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        addata.splice(result, 1);
        dbheaders.push("/", addata);
        res.json({ values: req.params.id });
    } else {
        res.json({
            //todo
            success: "Delete error. Refresh page",
            status: 500
        });
    }
});


// Ads CRUD
//**********************

// Ads
router.get('/Ads', function (req, res) {
    res.render('admin/ads', { csrfToken: req.csrfToken() });
});


// Read
router.get('/Ads/list', function (req, res) {
    dbads.reload();
    var adsdata = dbads.getData("/");
    res.json({ "totalCount": adsdata.length, "items": adsdata });
});

// Create
router.post('/Ads', function (req, res) {
    dbads.reload();
    var adsdata = dbads.getData("/");
    req.body.Id = uuidv4();
    req.body.AdvertJS = comfunc.A2B(req.body.AdvertJS);
    dbads.push("/" + adsdata.length, req.body, false);
    res.json({ values: req.body });
});


// Update
router.post('/Ads/:id', function (req, res) {
    dbads.reload();
    var result = dbads.getData("/").findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        req.body.Id = req.params.id;
        req.body.AdvertJS = comfunc.A2B(req.body.AdvertJS);
        dbads.push("/" + result, req.body);
        res.json({ values: req.body });
    } else {
        //todo
        res.json({
            success: "Update Error. Refresh page",
            status: 500
        });
    }

});

// Delete
router.post('/Ads/d/:id', function (req, res) {
    dbads.reload();
    var addata = dbads.getData("/");
    var result = addata.findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        addata.splice(result, 1);
        dbads.push("/", addata);
        res.json({ values: req.params.id });
    } else {
        res.json({
            //todo
            success: "Delete error. Refresh page",
            status: 500
        });
    }
});

// Main Websites CRUD
//**********************


router.get('/Templates', function (req, res) {
    res.render('admin/templates', { csrfToken: req.csrfToken() });
});

// Read
router.get('/Templates/list', function (req, res) {
    dbtemplates.reload();
    var adsdata = dbtemplates.getData("/");
    res.json({ "totalCount": adsdata.length, "items": adsdata });
});

// Create
router.post('/Templates', function (req, res) {
    dbtemplates.reload();
    var adsdata = dbtemplates.getData("/");
    req.body.Id = uuidv4();
    var data = "<html><title>@!Title</title><meta name=\"Description\" content=\"@!Desc\">\n<head>\n@!section('HeaderScript')\n</head>\n<body>\n@!section('BodyScript')\n<h1>\n@!section('ad_first')\n</h1>\n<h2>\n@!section('mod_first')\n</h2>\n@!section('FooterScript')\n</body>\n</html>";
    req.body.HTML = comfunc.A2B(data);
    dbtemplates.push("/" + adsdata.length, req.body, false);
    res.json({ values: req.body });
});

// update
router.post('/Templates/:id', function (req, res) {
    dbtemplates.reload();
    var result = dbtemplates.getData("/").findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        var element = dbtemplates.getData("/" + result)
        element.Alias = req.body.Alias;
        dbtemplates.push("/" + result, element);
        res.json({ values: element });
    } else {
        res.json({
            // todo
            success: "Update Error. Refresh page",
            status: 500
        });
    }
});

// Delete template
router.post('/Templates/d/:id', function (req, res) {
    dbtemplates.reload();
    var addata = dbtemplates.getData("/");
    var result = addata.findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        addata.splice(result, 1);
        dbtemplates.push("/", addata);
        res.json({ values: req.params.id });
        // todo delete all from other db
    } else {
        // todo
        res.json({
            success: "Delete error. Refresh page",
            status: 500
        });
    }
});




// Read template
router.get('/Templates/e/:id', function (req, res) {
    dbtemplates.reload();
    var addata = dbtemplates.getData("/");
    var result = addata.findIndex(item => item.Id === req.params.id);
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

});

// Save template
router.post('/Templates/e/:id', function (req, res) {
    dbtemplates.reload();
    var result = dbtemplates.getData("/").findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        var element = dbtemplates.getData("/" + result)
        element.HTML = comfunc.A2B(req.body.filecon);
        dbtemplates.push("/" + result, element);

    }
    res.redirect('/admin/Templates');
    //TODO 
    // CHANGE cmsroutersad
});

/*TODO
// Delete
router.post('/Mainwebsites/d/:id', function (req, res) {
    fs.access("./views/" + req.params.id + ".edge", fs.constants.F_OK | fs.constants.W_OK, (err) => {
        if (err) {
            res.json({
                success: req.params.id + " file does not exists. Refresh page",
                status: 500
            });
        } else {
            fs.unlink("./views/" + req.params.id + ".edge", (error) => {
                if (error) {
                    res.json({
                        success: req.params.id + " " + error.message,
                        status: 500
                    });
                } else {
                    //delete all content
                    dbcontents.reload();
                    dburls.reload();
                    var addata = dbcontents.getData("/");
                    var addata1 = dbcontents.getData("/");
                    var addata2 =  dburls.getData("/");
                    addata1.forEach(function(item) {
                    
                    var result = addata.findIndex(item => item.FileLayout === req.params.id);
                    if (result > -1) {
                        //delete all urls with this content
                        var data=dbcontents.getData("/"+result);
                        addata2.forEach(function(item) {
                                dburls.reload();
                                var addata3 = dburls.getData("/");
                                // find by id
                                var result2 = addata3.findIndex(item => item.BodyID === data.Id);
                                if (result2 > -1) {
                                    addata3.splice(result, 1);
                                    dburls.push("/", addata3);
                                }
                        });


                        addata.splice(result, 1);
                        dbcontents.push("/", addata);
                
                        // delete head ads      
                        dbcontentsad.reload();
                        var filtered = dbcontentsad.getData("/").filter(function (value) { return value.HeadId != data.Id; });
                
                        dbcontentsad.push("/", filtered);
                
                    } 
                });


                    res.json({
                        success: req.params.id + " deleted successfully",
                        status: 200
                    });
                }
            })
        }
    });
});
*/

// Routers ads CRUD
//**********************
router.get('/Routersad/ads/list/:id', function (req, res) {
    dbroutersad.reload();
    var adsdata = dbroutersad.getData("/");
    var filtered = adsdata.filter(function (value) { return value.Mode =="A" && value.HeadId == req.params.id; });
    res.json({ "totalCount": filtered.length, "items": filtered });
});

router.get('/Routersad/moduls/list/:id', function (req, res) {
    dbroutersad.reload();
    var adsdata = dbroutersad.getData("/");
    var filtered = adsdata.filter(function (value) { return value.Mode =="M" && value.HeadId == req.params.id; });
    res.json({ "totalCount": filtered.length, "items": filtered });
});

// Create
router.post('/Routersad/:id', function (req, res) {
    dbroutersad.reload();
    var addata = dbroutersad.getData("/");
    var result = addata.findIndex(item => item.Id === req.params.id);
    if (result > -1)       
        dbroutersad.push("/" + result, req.body);
    
    res.json({ values: req.body });
});

// Routers CRUD
//**********************

// Read
router.get('/Routers', function (req, res) {
    res.render('admin/routers', { csrfToken: req.csrfToken() });
});


router.get('/Routers/list/:id', function (req, res) {
    dbrouters.reload();
    var adsdata = dbrouters.getData("/");
    res.json(req.params.id == 2 ? adsdata : { "totalCount": adsdata.length, "items": adsdata });
});

router.get('/Routers/listext/headers', function (req, res) {
    dbheaders.reload();
    res.json(dbheaders.getData("/"));
});

router.get('/Routers/listext/templates', function (req, res) {
    dbwebsites.reload();
    var dbweb=dbwebsites.getData("/");
    dbtemplates.reload();
    var data=dbtemplates.getData("/");
    var indices = [];
    data.forEach(function (element) {
        var result = dbweb.findIndex(item => item.Id === element.WebsiteId);
        var website="";
        if (result > -1) {
            website = " ("+dbwebsites.getData("/" + result).Website+")";
        }
        indices.push({ "Id": element.Id, "Alias": element.Alias+website});        
      });
    res.json(indices);
});

router.get('/Routers/listext/adgroups', function (req, res) {
    dbads.reload();
    var grouped = _.groupBy(dbads.getData("/"), ad => ad.GroupID.trim());

    var tmp = [{ "Id": "@", "Group": "---" }];
    _.forEach(Object.keys(grouped), function (value) {
        tmp.push({ "Id": value.trim(), "Group": value.trim() });
    });

    res.json(tmp);
});

router.get('/Routers/listext/modulgroups', function (req, res) {
    dbmoduls.reload();
    var grouped = _.groupBy(dbmoduls.getData("/"), ad => ad.GroupID.trim());

    var tmp = [{ "Id": "@", "Group": "---" }];
    _.forEach(Object.keys(grouped), function (value) {
        tmp.push({ "Id": value.trim(), "Group": value.trim() });
    });
    res.json(tmp);
});


// Create
router.post('/Routers', function (req, res) {

    dbrouters.reload();
    var adsdata = dbrouters.getData("/");
    req.body.Id = uuidv4();
    dbrouters.push("/" + adsdata.length, req.body, false);
    var adsections = comfunc.GetSections(req.body.TemplateId, req.body.Id);
    dbroutersad.reload();
    var adsdataad = dbroutersad.getData("/");
    adsections.forEach(function (value) {
        dbroutersad.push("/" + adsdataad.length, value, false);
    });

    res.json({ values: req.body });
});

// Update
router.post('/Routers/:id', function (req, res) {

    dbrouters.reload();
    var addata = dbrouters.getData("/");
    var result = addata.findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        var element = dbrouters.getData("/" + result)
        req.body.Id = req.params.id;
        dbrouters.push("/" + result, req.body);

        // change template
        if (element.TemplateId != req.body.TemplateId) {
            // delete old data
            var addataAds = dbroutersad.getData("/");
            var filtered = addataAds.filter(function (value) { return value.HeadId != req.params.id; });
            dbroutersad.push("/", filtered);

            // add new template
            var adsections = comfunc.GetSections(req.body.TemplateId, req.body.Id);
            dbroutersad.reload();
            var adsdataad = dbroutersad.getData("/");
            adsections.forEach(function (value) {
                dbroutersad.push("/" + adsdataad.length, value, false);
            });

        }

        res.json({ values: req.body });
    } else {
        // todo
        res.json({
            success: "Delete error. Refresh page",
            status: 500
        });
    }

});




// Delete
router.post('/Routers/d/:id', function (req, res) {

    dbrouters.reload();
    var addata = dbrouters.getData("/");
    var result = addata.findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        addata.splice(result, 1);
        dbrouters.push("/", addata);
        dbroutersad.reload();
        var addataAds = dbroutersad.getData("/");
        var filtered = addataAds.filter(function (value) { return value.HeadId != req.params.id; });

        dbroutersad.push("/", filtered);

        res.json({ values: req.params.id });
    } else {
        // todo
        res.json({
            success: "Delete error. Refresh page",
            status: 500
        });
    }

});


// Urls CRUD
//**********************

// Urls
router.get('/Urls', function (req, res) {
    res.render('admin/urls', { csrfToken: req.csrfToken() });
});

// Read
router.get('/Urls/list', function (req, res) {
    dburls.reload();
    var adsdata = dburls.getData("/");
    res.json({ "totalCount": adsdata.length, "items": adsdata });
});

// Create
router.post('/Urls', function (req, res) {
    dburls.reload();
    var adsdata = dburls.getData("/");
    req.body.Id = uuidv4();
    req.body.Website=comfunc.GetWebsite(req.body.RouterId);
    dburls.push("/" + adsdata.length, req.body, false);
    res.json({ values: req.body });
});

router.get('/Urls/list/type', function (req, res) {
    res.json(comfunc.UrlType());
});

router.get('/Urls/list/changefreq', function (req, res) {
    res.json(comfunc.RobotList());
});




// Update
router.post('/Urls/:id', function (req, res) {
    dburls.reload();
    var result = dburls.getData("/").findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        req.body.Id = req.params.id;
        req.body.Website=comfunc.GetWebsite(req.body.RouterId);
        dburls.push("/" + result, req.body);
        res.json({ values: req.body });
    } else {
        //todo
        res.json({
            success: "Update Error. Refresh page",
            status: 500
        });
    }
});

// Delete
router.post('/Urls/d/:id', function (req, res) {
    dburls.reload();
    var addata = dburls.getData("/");
    var result = addata.findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        addata.splice(result, 1);
        dburls.push("/", addata);
        res.json({ values: req.params.id });
    } else {
        res.json({
            //todo
            success: "Delete error. Refresh page",
            status: 500
        });
    }
});

// Moduls CRUD
//**********************

// List
router.get('/Moduls', function (req, res) {
    res.render('admin/moduls', { csrfToken: req.csrfToken() });
});


// Read
router.get('/Moduls/list', function (req, res) {
    dbmoduls.reload();
    var adsdata = dbmoduls.getData("/");
    res.json({ "totalCount": adsdata.length, "items": adsdata });
});

// Read
router.get('/Moduls/list/modules', function (req, res) {
    res.json(comfunc.Modules());
});


// Create
router.post('/Moduls', function (req, res) {
    dbmoduls.reload();
    var adsdata = dbmoduls.getData("/");
    req.body.Id = uuidv4();
    dbmoduls.push("/" + adsdata.length, req.body, false);
    res.json({ values: req.body });
});


// Update
router.post('/Moduls/:id', function (req, res) {
    dbmoduls.reload();
    var result = dbmoduls.getData("/").findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        req.body.Id = req.params.id;
        dbmoduls.push("/" + result, req.body);
        res.json({ values: req.body });
    } else {
        //todo
        res.json({
            success: "Update Error. Refresh page",
            status: 500
        });
    }

});

// Delete
router.post('/Moduls/d/:id', function (req, res) {
    dbmoduls.reload();
    var addata = dbmoduls.getData("/");
    var result = addata.findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        addata.splice(result, 1);
        dbmoduls.push("/", addata);
        res.json({ values: req.params.id });
    } else {
        res.json({
            //todo
            success: "Delete error. Refresh page",
            status: 500
        });
    }
});

// Read moduls
router.get('/Moduls/m/:id', function (req, res) {

    dbmoduls.reload();
    data = _.find(dbmoduls.getData("/"), { 'Id': req.params.id });

    var convertdata = cmsmodulread[data.Modul](data.Data);

    res.render('admin/moduls/' + data.Modul, {
        id: req.params.id,
        data: convertdata,
        alias: data.Alias,
        modul:data.Modul,
        csrfToken: req.csrfToken()
    });
});

// Update moduls
router.post('/Moduls/m/:id/:modul', function (req, res) {
    dbmoduls.reload();
    var result = dbmoduls.getData("/").findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        var adatmodul = cmsmodulupdate[req.params.modul](req.body.filecon);
        var data = dbmoduls.getData("/" + result);
        data.Data = adatmodul;
        dbmoduls.push("/" + result, data);
    }
    res.redirect('/admin/Moduls');
});


module.exports = router;