var express = require('express'),
    router = express.Router(),
    JsonDB = require('node-json-db'),
    passport = require('passport'),
    comfunc = require(`${__base}app/comfunc.js`),
    DbFunc = require(`${__base}app/routers/dbfunc.js`),
    db = new JsonDB(`${__base}db/config`, true, false);

require(`${__base}app/passportlogin.js`);

try {
    db.reload();
    var globalconfigdata = db.getData("/");
}
catch (err) { console.log(err); }


// Is user login ?
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}

function notLoggedIn(req, res, next) {
    if (!req.isAuthenticated())
        return next();
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
    res.render('admin/dashboard', { filedb: comfunc.GetDbSize(), csrfToken: req.csrfToken(), geoexp: comfunc.GeoExpired() });
});



// File Manager
//**********************
router.get('/FileManager', function (req, res) {
    res.render('admin/filemanager', { filedb: comfunc.GetDbSize(), csrfToken: req.csrfToken() });
});

router.get('/FileManager/list', function (req, res) {
    var filelist=comfunc.walkSync(`${__base}public/`);
    res.json({ "totalCount": filelist.length, "items": filelist } );
});

// Database
//**********************
router.get('/DB', function (req, res) {
    db.reload();
    res.render('admin/database', { config: db.getData("/"), csrfToken: req.csrfToken() });
});

router.post('/DB', function (req, res) {
    try {
        var configdata = db.getData("/");
        configdata.DB = req.body.DB;
        configdata.MongoConn = req.body.MongoConn;
        db.push("/", configdata);
        res.json({
            success: "Settings saved",
            status: 200
        });
    }
    catch (err) {
        res.json({
            success: err,
            status: 500
        });
    }
});

// Fiewall
//**********************
router.get('/Firewall', function (req, res) {
    db.reload();
    res.render('admin/firewall', { config: db.getData("/"), csrfToken: req.csrfToken(), ip: req.location.ip });
});

router.get('/Firewall/countries/:id', function (req, res) {
    var list = comfunc.CountriesList();
    if (req.params.id == '2')
        list.push({ name: 'All', code: '*' });
    res.json(list);
});

router.post('/Firewall', function (req, res) {
    try {
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
    } catch (err) {
        res.json({
            success: err,
            status: 500
        });
    }
});


// Settings
//**********************
router.get('/Settings', function (req, res) {
    db.reload();
    res.render('admin/settings', { config: db.getData("/"), csrfToken: req.csrfToken() });
});

router.post('/Settings', function (req, res) {
    try {
        var configdata = db.getData("/");
        configdata.compress = req.body.compress;
        configdata.XPowerBy = req.body.XPowerBy;
        db.push("/", configdata);
        res.json({
            success: "Settings saved",
            status: 200
        });
    } catch (err) {
        res.json({
            success: err,
            status: 500
        });
    }
});


// Change Pwd
//**********************
router.get('/ChangePwd', function (req, res) {
    db.reload();
    res.render('admin/changepwd', { config: db.getData("/"), csrfToken: req.csrfToken() });
});

router.post('/ChangePwd', function (req, res) {
    try {
        var configdata = db.getData("/");

        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (re.test(req.body.AdminUser) && req.body.AdminPWD.length > 5) {
            configdata.AdminUser = req.body.AdminUser;
            configdata.AdminPWD = req.body.AdminPWD;
            db.push("/", configdata);
            res.json({
                success: "Login details saved.",
                status: 200
            });
        }
        else {
            res.json({
                success: "Invalid email or too short password. Password is min 6 char !",
                status: 500
            });
        }
    } catch (err) {
        res.json({
            success: err,
            status: 500
        });
    }
});


// Langs 
//**********************
router.get('/Langs', function (req, res) {
    res.render('admin/langs', { csrfToken: req.csrfToken() });
});

router.post('/Langs', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_PostLangs"](req.body));
});

router.get('/Langs/list/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_ListLangs"](req.params.id));
});

router.post('/Langs/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_UpdateLangs"](req.params.id, req.body));
});

router.post('/Langs/d/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_DeleteLangs"](req.params.id));
});

// Websites
//**********************
router.get('/Websites', function (req, res) {
    res.render('admin/websites', { csrfToken: req.csrfToken() });
});

router.post('/Websites', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_PostWebsites"](req.body));
});

router.get('/Websites/list/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_ListWebsites"](req.params.id));
});

router.post('/Websites/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_UpdateWebsites"](req.params.id, req.body));
});

router.post('/Websites/d/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_DeleteWebsites"](req.params.id));
});

// Headers
//**********************
router.get('/Headers', function (req, res) {
    res.render('admin/headers', { csrfToken: req.csrfToken() });
});

router.get('/Headers/list', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_ListHeaders"]());
});

router.post('/Headers', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_PostHeaders"](req.body));
});

router.post('/Headers/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_UpdateHeaders"](req.params.id, req.body));
});

router.post('/Headers/d/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_DeleteHeaders"](req.params.id));
});

// Ads
//**********************
router.get('/Ads', function (req, res) {
    res.render('admin/ads', { csrfToken: req.csrfToken() });
});

router.get('/Ads/list', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_ListAds"]());
});

router.post('/Ads', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_PostAds"](req.body));
});

router.post('/Ads/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_UpdateAds"](req.params.id, req.body));
});

router.post('/Ads/d/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_DeleteAds"](req.params.id));
});

// Main Websites
//**********************
router.get('/Templates', function (req, res) {
    res.render('admin/templates', { csrfToken: req.csrfToken() });
});

router.get('/Templates/list', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_ListTemplates"]());
});

router.post('/Templates', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_PostTemplates"](req.body));
});

router.post('/Templates/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_UpdateTemplates"](req.params.id, req.body));
});

router.post('/Templates/d/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_DeleteTemplates"](req.params.id));
});

router.get('/Templates/e/:id', function (req, res) {
    DbFunc[globalconfigdata.DB + "_ReadTemplates"](req.params.id, res, req);
});

router.post('/Templates/e/:id', function (req, res) {
    DbFunc[globalconfigdata.DB + "_SaveTemplates"](req.params.id, req.body,res);
});

// Routersads
//**********************
router.get('/Routersad/ads/list/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_ListRoutersAds"](req.params.id, "A"));
});

router.get('/Routersad/moduls/list/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_ListRoutersAds"](req.params.id, "M"));
});

router.post('/Routersad/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_UpdateRoutersAds"](req.params.id, req.body));
});

// Routers 
//**********************
router.get('/Routers', function (req, res) {
    res.render('admin/routers', { csrfToken: req.csrfToken() });
});

router.get('/Routers/list/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_ListRouters"](req.params.id));
});

router.get('/Routers/listext/headers', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_ListExtHeaders"]());
});

router.get('/Routers/listext/templates', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_ListExtTemplates"]());
});

router.get('/Routers/listext/adgroups', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_ListExtAdGroups"]());
});

router.get('/Routers/listext/modulgroups', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_ListExtModulGroups"]());
});

router.post('/Routers', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_PostRouter"](req.body));
});

router.post('/Routers/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_UpdateRouter"](req.params.id, req.body));
});

router.post('/Routers/d/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_DeleteRouter"](req.params.id));
});

// Urls
//**********************
router.get('/Urls', function (req, res) {
    res.render('admin/urls', { csrfToken: req.csrfToken() });
});

router.get('/Urls/list', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_ListUrls"]());
});

router.post('/Urls', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_PostUrl"](req.body));
});

router.get('/Urls/list/type', function (req, res) {
    res.json(comfunc.UrlType());
});

router.get('/Urls/list/changefreq', function (req, res) {
    res.json(comfunc.RobotList());
});

router.post('/Urls/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_UpdateUrl"](req.params.id, req.body));
});

router.post('/Urls/d/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_DeleteUrl"](req.params.id));
});

// Moduls
//**********************
router.get('/Moduls', function (req, res) {
    res.render('admin/moduls', { csrfToken: req.csrfToken() });
});

router.get('/Moduls/list', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_ListModuls"]());
});

router.get('/Moduls/list/modules', function (req, res) {
    res.json(comfunc.Modules());
});

router.post('/Moduls', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_PostModul"](req.body));
});

router.post('/Moduls/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_UpdateModul"](req.params.id, req.body));
});

router.post('/Moduls/d/:id', function (req, res) {
    res.json(DbFunc[globalconfigdata.DB + "_DeleteModul"](req.params.id));
});

router.get('/Moduls/m/:id', function (req, res) {
    DbFunc[globalconfigdata.DB + "_ReadModul"](req.params.id, req, res);
});

router.post('/Moduls/m/:id/:modul', function (req, res) {
    DbFunc[globalconfigdata.DB + "_SaveModul"](req, res);
});

module.exports = router;