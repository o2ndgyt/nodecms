var express = require('express'),
    router = express.Router(),
    uuidv4 = require('uuid/v4'),
    JsonDB = require('node-json-db'),
    passport = require('passport'),
    path = require('path'),
    archiver = require('archiver'),
    multer = require('multer'),
    fs = require('fs-extra'),
    findRemoveSync = require('find-remove'),
    comfunc = require(`${__base}app/comfunc.js`),
    filemanager = require(`${__base}app/routers/filemanager.js`),
    DbFunc = require(`${__base}app/routers/dbfunc.js`),
    db = new JsonDB(`${__base}db/config`, true, false);

var fileName = [];

const multerConfig = {
    storage: multer.diskStorage({
        destination: function (req, file, next) {
            next(null, './');
        },
        filename: function (req, file, next) {
            fileName.push(file.originalname);
            next(null, file.originalname);
        }
    }),

    fileFilter: function (req, file, next) {
        next(null, true);
    }
};


require(`${__base}app/passportlogin.js`);

const contentRootPath = `${__base}public`;

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

router.get('/FileManager/GetImage', function (req, res) {
    var image = req.query.path;
    fs.readFile(contentRootPath + image, function (err, content) {
        if (err) {
            res.writeHead(400, { 'Content-type': 'text/html' });
            res.end("No such image");
        } else {
            res.writeHead(200, { 'Content-type': 'image/jpg' });
            res.end(content);
        }
    });
});

router.post('/FileManager/Upload', multer(multerConfig).any('uploadFiles'), function (req, res) {
    var obj;
    for (var i = 0; i < fileName.length; i++) {
        fs.rename('./' + fileName[i], path.join(contentRootPath, req.body.path + fileName[i]), function (err) {
            if (err) throw err;
        });
    }
    res.send('Success');
    fileName = [];
});

router.post('/FileManager/Download', function (req, res) {
    findRemoveSync(`${__base}private/temp`, {age: {seconds: 3600}});
    var downloadObj = JSON.parse(req.body.downloadInput);
    if (downloadObj.names.length === 1 && downloadObj.data[0].isFile) {
        var file = contentRootPath + downloadObj.path + downloadObj.names[0];
        res.download(file);
    } else {
        var archive = archiver('zip', {
            gzip: true,
            zlib: { level: 9 } 
        });
        var filename=`${__base}private/temp/Files_${uuidv4()}.zip`
        var output = fs.createWriteStream(filename);
        downloadObj.data.forEach(function (item) {
            archive.on('error', function (err) {
                throw err;
            });
            if (item.isFile) {
                archive.file(contentRootPath + downloadObj.path + item.name, { name: item.name });
            }
            else {
                archive.directory(contentRootPath + downloadObj.path + item.name + "/", item.name);
            }
        });
        archive.pipe(output);
        archive.finalize();
        output.on('close', function () {
            var stat = fs.statSync(output.path);
            res.writeHead(200, {
                'Content-disposition': 'attachment; filename=Files.zip; filename*=UTF-8',
                'Content-Type': 'APPLICATION/octet-stream',
                'Content-Length': stat.size
            });
            var filestream = fs.createReadStream(output.path);
            filestream.pipe(res);
        });
    }
});

router.post('/FileManager/list', function (req, res) {
    req.setTimeout(0);
    if (req.body.action == "details") {
        filemanager.getFileDetails(req, res, contentRootPath + req.body.path);
    }

    if (req.body.action == "copy") {
        filemanager.CopyFiles(req, res, contentRootPath);
    }

    if (req.body.action == "move") {
        filemanager.MoveFiles(req, res, contentRootPath);
    }
    if (req.body.action == "create") {
        filemanager.createFolder(req, res, contentRootPath + req.body.path);
    }
    if (req.body.action == "delete") {
        filemanager.deleteFolder(req, res, contentRootPath + req.body.path);
    }
    if (req.body.action === "rename") {
        filemanager.renameFolder(req, res, contentRootPath + req.body.path);
    }

    if (req.body.action === 'search') {
        var fileList = [];
        filemanager.fromDir(contentRootPath + req.body.path, req.body.searchString.replace(/\*/g, ""), contentRootPath);
        (async () => {
            const tes = await  filemanager.FileManagerDirectoryContent(req, res, contentRootPath + req.body.path);
            response = { cwd: tes, files: fileList };
            response = JSON.stringify(response);
            res.setHeader('Content-Type', 'application/json');
            res.json(response);
        })();
    }

    if (req.body.action == "read") {
        (async () => {
            const filesList = await filemanager.GetFiles(req, res);
            const cwdFiles = await filemanager.FileManagerDirectoryContent(req, res, contentRootPath + req.body.path);
            var response = {};
            filemanager.ReadDirectories(filesList,req).then(data => {
                response = { cwd: cwdFiles, files: data };
                response = JSON.stringify(response);
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            });

        })();
    }

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
    var httpApache=fs.readFileSync(`${__base}private${path.sep}apache${path.sep}template.http.conf`,"utf8");
    var httpsApache=fs.readFileSync(`${__base}private${path.sep}apache${path.sep}template.https.conf`,"utf8");
    var httpNginx=fs.readFileSync(`${__base}private${path.sep}nginx${path.sep}template.http.conf`,"utf8");
    var httpsNginx=fs.readFileSync(`${__base}private${path.sep}nginx${path.sep}template.https.conf`,"utf8");

    res.render('admin/settings', {httpApache:httpApache, httpsApache: httpsApache, httpNginx: httpNginx,httpsNginx:httpsNginx, config: db.getData("/"), csrfToken: req.csrfToken() });
});

router.post('/Settings', function (req, res) {
    try {
        var configdata = db.getData("/");
        configdata.compress = req.body.compress;
        configdata.XPowerBy = req.body.XPowerBy;
        configdata.webs=req.body.webs;
        configdata.ssl=req.body.ssl;
        configdata.spdy=req.body.spdy;
        
        db.push("/", configdata);

        fs.writeFile(`${__base}private${path.sep}apache${path.sep}template.http.conf`, req.body.httpApache);
        fs.writeFile(`${__base}private${path.sep}apache${path.sep}template.https.conf`, req.body.httpsApache);
        fs.writeFile(`${__base}private${path.sep}nginx${path.sep}template.http.conf`, req.body.httpNginx);
        fs.writeFile(`${__base}private${path.sep}nginx${path.sep}template.https.conf`, req.body.httpsNginx);

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
    DbFunc[globalconfigdata.DB + "_SaveTemplates"](req.params.id, req.body, res);
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