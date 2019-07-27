var express = require('express'),
    router = express.Router(),
    JsonDB = require('node-json-db'),
    _ = require('lodash'),
    csrf = require('csurf'),
    passport = require('passport'),
    uuidv4 = require('uuid/v4'),
    comfunc = require(`${__base}app/comfunc.js`),
    db = new JsonDB(`${__base}db/config.js`, true, false),
    dbads = new JsonDB(`${__base}db/cmsad.js`, true, false),
    dbtemplates = new JsonDB(`${__base}db/cmstemplates.js`, true, false),
    dblangs = new JsonDB(`${__base}db/cmslangs.js`, true, false),
    dbheaders = new JsonDB(`${__base}db/cmsheaders.js`, true, false),
    dbrouters = new JsonDB(`${__base}db/cmsrouters.js`, true, false),
    dbroutersad = new JsonDB(`${__base}db/cmsroutersad.js`, true, false),
    dburls = new JsonDB(`${__base}db/cmsurls.js`, true, false),
    dbmoduls = new JsonDB(`${__base}db/cmsmoduls.js`, true, false),
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
    res.render('admin/dashboard', { filedb: comfunc.GetDbSize(), csrfToken: req.csrfToken() });
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
    res.render('admin/firewall', { config: configdata, csrfToken: req.csrfToken() });
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
    configdata.Appport = req.body.Appport;
    configdata.compress = req.body.compress;
    configdata.XPowerBy = req.body.XPowerBy;
    db.push("/", configdata);
    res.json({
        success: "Settings saved",
        status: 200
    });
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
router.get('/Langs/list', function (req, res) {
    dblangs.reload();
    var adsdata = dblangs.getData("/");
    res.json({ "totalCount": adsdata.length, "items": adsdata });
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

// Routers CRUD
//**********************

// Read
router.get('/Routers', function (req, res) {
    res.render('admin/routers', { csrfToken: req.csrfToken() });
});


router.get('/Routers/list', function (req, res) {
    dbrouters.reload();
    var adsdata = dbrouters.getData("/");
    res.json({ "totalCount": adsdata.length, "items": adsdata });
});

router.get('/Routersad/list/:modul', function (req, res) {
    dbroutersad.reload();
    var adsdata = dbroutersad.getData("/");
    res.json({ "totalCount": adsdata.length, "items": adsdata });
});


router.get('/Routers/list/headers', function (req, res) {
    dbheaders.reload();
    res.json(dbheaders.getData("/"));
});

router.get('/Routers/list/templates', function (req, res) {
    dbtemplates.reload();
    res.json(dbtemplates.getData("/"));
});

router.get('/Routers/list/adgroups', function (req, res) {
    dbads.reload();
    var grouped = _.groupBy(dbads.getData("/"), ad => ad.GroupID.trim());

    var tmp = [{ "Id": "---", "GroupID": "---" }];
    _.forEach(Object.keys(grouped), function (value) {
        tmp.push({ "Id": value.trim(), "GroupID": value.trim() });
    });

    res.json(tmp);
});

router.get('/Routers/list/modulgroups', function (req, res) {
    dbmoduls.reload();
    var grouped = _.groupBy(dbmoduls.getData("/"), ad => ad.GroupID.trim());

    var tmp = [{ "Id": "---", "GroupID": "---" }];
    _.forEach(Object.keys(grouped), function (value) {
        tmp.push({ "Id": value.trim(), "GroupID": value.trim() });
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



/*
// Read
router.get('/Routers/e/:id', function (req, res) {
    dbrouters.reload();
    var addata = dbrouters.getData("/");
    var filterhead = addata.filter(function (value) { return value.Id == req.params.id; });

    dbroutersad.reload();
    var addataAds = dbroutersad.getData("/");
    var filteredA = addataAds.filter(function (value) { return value.HeadId == req.params.id && value.Mode == "A"; });
    var filteredM = addataAds.filter(function (value) { return value.HeadId == req.params.id && value.Mode == "M"; });

    dbheaders.reload();
    var headers = dbheaders.getData("/");

    dbads.reload();
    var adsdata = dbads.getData("/");
    var grouped = _.groupBy(adsdata, ad => ad.GroupID.trim());

    var tmp = [];
    _.forEach(Object.keys(grouped), function (value) {
        tmp.push({ "Name": value.trim() });
    });

    var tmp1 = _.functionsIn(cmsmodulread);
    var tmp2 = [];
    _.forEach(tmp1, function (value) { tmp2.push({ "Name": value.trim() }); });

    req.session.moduls=[];
    res.render('admin/contentsupdate', {
        title: filterhead[0].Alias,
        id: req.params.id,
        headers: headers,
        ads: filteredA,
        groupids: tmp,
        pagemoduls: filteredM,
        moduls: tmp2
    });


});
*/
/*
// Update file
router.post('/Contents/e/:id', function (req, res) {
 
    // update content
    dbcontents.reload();
    var addata = dbcontents.getData("/");
    var result =  _.find(addata, { 'Id': req.params.id });
    var index = addata.findIndex(item => item.Id === req.params.id );
    if (index > -1) {
        result.Alias=req.body.Alias;
        result.HeadId=req.body.HeadId;
        dbcontents.push("/" + index, result);
    }

    // update ads
    dbcontentsad.reload();
    var addataAds = dbcontentsad.getData("/");

    // collect all modul ads
    var filteredA = addataAds.filter(function (value) { return value.HeadId == req.params.id});
    filteredA.forEach( function (value) {
        var resultads = _.find(addataAds, { 'Id': value.Id });
        var indexads = addataAds.findIndex(item => item.Id === value.Id);
        if (indexads > -1) {
            resultads.GroupID=req.body["ad_"+value.Id];
            dbcontentsad.push("/" + indexads, resultads);
        }

    });



     // session available then save session to db
    if (req.session.moduls.length>0)
    {    
        req.session.moduls.forEach( function (value) 
        {        
            var resultad = _.find(addataAds, { 'Id': value.Id });
            var indexad = addataAds.findIndex(item => item.Id === value.Id);
            if (indexad > -1) {
                resultad.Data=value.Data;
                dbcontentsad.push("/" + indexad, resultad);
            }
        }
        );
    }
    res.redirect('/admin/Contents');
});
*/

/*
// Read moduls
router.get('/Contents/m/:id/:modul', function (req, res) {
    var data='';
    if (req.session.moduls.length>0)
    {
            // use session data
            data=_.find(req.session.moduls, { 'Id': req.params.id }).Data;           
    }
    else
    {
        // no session create session fill it from db
        dbcontentsad.reload();
        var addataAds = dbcontentsad.getData("/");
        data=_.find(addataAds, { 'Id': req.params.id }).Data;
    }
      
    // call read fn to convert data
    var adatmodul = cmsmodulread[req.params.modul](data);

    res.render('admin/moduls/' + req.params.modul, {
        id: req.params.id,
        data: adatmodul,
        modul:req.params.modul
    });
});
*/

/*
// Update moduls
router.post('/Contents/m/:id/:modul', function (req, res) {
    // call update fn to convert data
    var adatmodul = cmsmodulupdate[req.params.modul](req.body.filecon);
    // save to session
    if (req.session.moduls)
    {
        var index = _.findIndex(req.session.moduls, {'Id': req.params.id });
        // Replace item at index using native splice
        req.session.moduls.splice(index, 1, { "Id": req.params.id, "Data":adatmodul });   
    }
    else
    {    
        req.session.moduls.push({ "Id": req.params.id, "Data":adatmodul });
    }
    res.render('admin/moduls/None');
});
*/


// Urls CRUD
//**********************

// Urls
router.get('/Urls', function (req, res) {
    var fotter = '<th scope="row">{{index}}</th><td>{{json.PageFullUrl}}</td><td>{{json.Alias}}</td><td>{{LongBodyID(json.BodyID)}}</td><td>{{LongLang(json.Lang)}}</td><td>{{json.Type}}</td> <td><a href="#" onclick="edit({{index}})">Edit</a></td><td><a href="#" onclick="SendData(3,{{index}},\'{{json.Id}}\');">Delete</a></td>';
    dburls.reload();
    dblangs.reload();
    dbcontents.reload();
    var addata = dblangs.getData("/");
    var addata1 = dbcontents.getData("/");
    res.render('admin/urls', {
        fo: fotter,
        langs: addata,
        contents: addata1

    });
});

// Create
router.post('/Urls', function (req, res) {
    dburls.reload();
    var adsdata = dburls.getData("/");
    dburls.push("/" + adsdata.length, req.body, false);
    res.json({
        success: req.body.Alias + " created successfully",
        status: 200
    });
});

// Read
router.get('/Urls/list', function (req, res) {
    dburls.reload();
    try {
        var adsdata = dburls.getData("/");
    } catch (error) {
        console.error(error);
    };
    res.json(adsdata);
});


// Update
router.post('/Urls/:id', function (req, res) {
    dburls.reload();
    var result = dburls.getData("/").findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        dburls.push("/" + result, req.body);
        res.json({
            success: req.body.Alias + " updated successfully",
            status: 200
        });
    } else {
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
    // find by id
    var result = addata.findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        addata.splice(result, 1);
        dburls.push("/", addata);
        res.json({
            success: "Deleted successfully",
            status: 200
        });
    } else {
        res.json({
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

    var convertdata = cmsmodulread[data.Modul](data.Data, ["id0", "id1", "id2", "id3", "id4", "id5", "id6", "id7", "id8", "id9"]);

    res.render('admin/moduls/' + data.Modul, {
        id: req.params.id,
        data: convertdata,
        modul: data.Modul
    });
});

// Update moduls
router.post('/Moduls/m/:id', function (req, res) {
    dbmoduls.reload();
    var result = dbmoduls.getData("/").findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        var adatmodul = cmsmodulupdate[data.Modul](req.body.filecon, []);
        var data = dbmoduls.getData("/" + result);
        data.Data = adatmodul;
        dbmoduls.push("/" + result, data);
    }
    res.redirect('/admin/Moduls');
});




function myAuthorizer(username, password) {
    var configdata = db.getData("/");
    return username === configdata.AdminUser && password === configdata.AdminPWD;
}

module.exports = router;