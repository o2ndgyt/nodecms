var express = require('express');
var router = express.Router();
var basicAuth = require('express-basic-auth');
var osinfo = require('../models/osinfo')
var JsonDB = require('node-json-db');
var db = new JsonDB("./db/config", true, false);
var dbads = new JsonDB("./db/cmsad", true, false);
var dbheaders = new JsonDB("./db/cmsheaders", true, false);
var dbcontents = new JsonDB("./db/cmscontents", true, false);
var dbcontentsad = new JsonDB("./db/cmscontentsad", true, false);
var comfunc = require("../comfunc");
var oAuth = {
    authorizer: myAuthorizer,
    challenge: true,
    realm: 'Ku7VEtyc2B8mHFwrEpV6CAQtxGLySuLc'
};
var fs = require("fs");

router.use('/', basicAuth(oAuth), function (req, res, next) {
    next();
});


// Dashboard
//**********************
router.get('/Dashboard', function (req, res) {

    res.render('admin/dashboard', {
        osinfo: osinfo
    });
});

// Settings
//**********************
router.get('/Settings', function (req, res) {
    db.reload();
    var configdata = db.getData("/");
    res.render('admin/settings', {
        config: configdata,
        successmsg: '',
        noMessages: false
    });
});

router.post('/Settings', function (req, res) {
    var configdata = db.getData("/");
    configdata.Appport = req.body.Appport;
    configdata.compress = req.body.compress;
    configdata.XPowerBy = req.body.XPowerBy;
    configdata.AdminPWD = req.body.AdminPWD;
    configdata.AdminUser = req.body.AdminUser;
    db.push("/", configdata);
    db.reload();
    res.render('admin/settings', {
        config: configdata,
        successmsg: 'All settings saved.',
        noMessages: true
    });
});

// Headers CRUD
//**********************

// Header
router.get('/Headers', function (req, res) {
    var fotter = '<th scope="row">{{index}}</th><td>{{json.Alias}}</td><td><a href="#" onclick="edit({{index}})">Edit</a></td><td><a href="#" onclick="SendData(3,{{index}},\'{{json.Id}}\');">Delete</a></td>';
    res.render('admin/headers', {
        fo: fotter
    });
});

// Create
router.post('/Headers', function (req, res) {
    dbheaders.reload();
    var adsdata = dbheaders.getData("/");
    dbheaders.push("/" + adsdata.length, req.body, false);
    res.json({
        success: req.body.Alias + " created successfully",
        status: 200
    });
});

// Read
router.get('/Headers/list', function (req, res) {
    dbheaders.reload();
    try {
        var adsdata = dbheaders.getData("/");
    } catch (error) {
        console.error(error);
    };
    res.json(adsdata);
});


// Update
router.post('/Headers/:id', function (req, res) {
    dbheaders.reload();
    // find by id
    var result = dbheaders.getData("/").findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        dbheaders.push("/" + result, req.body);
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
router.post('/Headers/d/:id', function (req, res) {
    dbheaders.reload();
    var addata = dbheaders.getData("/");
    // find by id
    var result = addata.findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        addata.splice(result, 1);
        dbheaders.push("/", addata);
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




// Ads CRUD
//**********************

// Ads
router.get('/Ads', function (req, res) {
    var fotter = '<th scope="row">{{index}}</th><td>{{json.Name}}</td><td>{{json.GroupID}}</td><td><a href="#" onclick="edit({{index}})">Edit</a></td><td><a href="#" onclick="SendData(3,{{index}},\'{{json.Id}}\');">Delete</a></td>';
    res.render('admin/ads', {
        fo: fotter
    });
});

// Create
router.post('/Ads', function (req, res) {
    dbads.reload();
    var adsdata = dbads.getData("/");
    dbads.push("/" + adsdata.length, req.body, false);
    res.json({
        success: req.body.Name + " created successfully",
        status: 200
    });
});

// Read
router.get('/Ads/list', function (req, res) {
    dbads.reload();
    try {
        var adsdata = dbads.getData("/");
    } catch (error) {
        console.error(error);
    };
    res.json(adsdata);
});


// Update
router.post('/Ads/:id', function (req, res) {
    dbads.reload();
    // find by id
    var result = dbads.getData("/").findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        dbads.push("/" + result, req.body);
        res.json({
            success: req.body.Name + " updated successfully",
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
router.post('/Ads/d/:id', function (req, res) {
    dbads.reload();
    var addata = dbads.getData("/");
    // find by id
    var result = addata.findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        addata.splice(result, 1);
        dbads.push("/", addata);
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

// Main Websites CRUD
//**********************


router.get('/Mainwebsites', function (req, res) {
    var fotter = '<th scope="row">{{index}}</th><td>{{json.Name}}</td><td><a href="Mainwebsites/e/{{json.Name}}">Edit</a></td><td><a href="#" onclick="SendData(3,{{index}},\'{{json.Name}}\');">Delete</a></td>';
    res.render('admin/mainwebsites', {
        fo: fotter
    });
});

// Read
router.get('/Mainwebsites/list', function (req, res) {
    var tmp = [];
    comfunc.FileList().forEach(function (value) {
        tmp.push({
            "Name": value.replace("./views/", "").replace(".edge", "")
        });
    });
    res.json(tmp);
});

// Create
router.post('/Mainwebsites', function (req, res) {

    fs.access("./views/" + req.body.Name + ".edge", fs.constants.F_OK, (err) => {
        if (err) {
            var writeStream = fs.createWriteStream("./views/" + req.body.Name + ".edge");
            writeStream.write("<html>\n<head>\n@!section('HeaderScript')\n</head>\n<body>\n@!section('BodyScript')\n<h1>\n@!section('ad_first')\n</h1>\n<h2>\n@!section('mod_first')\n</h2>\n@!section('FooterScript')\n</body>\n</html>");
            writeStream.end();
            res.json({
                success: req.body.Name + " created successfully",
                status: 200
            });
        } else {
            res.json({
                success: req.body.Name + " file exists",
                status: 500
            });
        }
    });
});

// Read
router.get('/Mainwebsites/e/:file', function (req, res) {
    fs.access("./views/" + req.params.file + ".edge", fs.constants.F_OK | fs.constants.W_OK, (err) => {
        if (err) {
            // File in param does not exist
            //  res.redirect('/admin/Mainwebsites');
            res.send(err);
        } else {
            var data = fs.readFileSync("./views/" + req.params.file + ".edge", 'utf8');
            res.render('admin/mainwebsitesupdate', {
                title: req.params.file,
                filecon: data
            });

        }
    });

});

// Save file
router.post('/Mainwebsites/e/:file', function (req, res) {
    // save data to file
    var writeStream = fs.createWriteStream("./views/" + req.params.file + ".edge");
    writeStream.write(req.body.filecon);
    writeStream.end();
    //rename the file
    if (req.params.file != req.body.Name) {
        fs.rename("./views/" + req.params.file + ".edge", "./views/" + req.body.Name + ".edge", function (err) {
            if (err) console.log('ERROR: ' + err);
        });

    }
    res.redirect('/admin/Mainwebsites');

});


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
                    res.json({
                        success: req.params.id + " deleted successfully",
                        status: 200
                    });
                }
            })
        }
    });
});

// Contents CRUD
//**********************


router.get('/Contents', function (req, res) {
    var fotter = '<th scope="row">{{index}}</th><td>{{json.Alias}}</td><td>{{json.FileLayout}}</td><td><a href="Contents/e/{{json.Id}}">Edit</a></td><td><a href="#" onclick="SendData(3,{{index}},\'{{json.Id}}\');">Delete</a></td>';
    dbheaders.reload();
    var headers = dbheaders.getData("/");
    var tmp = [];
    comfunc.FileList().forEach(function (value) {
        tmp.push({
            "Name": value.replace("./views/", "").replace(".edge", "")
        });
    });
    res.render('admin/contents', {
        fo: fotter,
        headers: headers,
        filelayouts: tmp
    });
});

// Read
router.get('/Contents/list', function (req, res) {
    dbcontents.reload();
    try {
        var adsdata = dbcontents.getData("/");
    } catch (error) {
        console.error(error);
    };
    res.json(adsdata);
});

// Create
router.post('/Contents', function (req, res) {
    try {
        dbcontents.reload();
        var adsdata = dbcontents.getData("/");
        dbcontents.push("/" + adsdata.length, req.body, false);
        // read main file
        var adsections = comfunc.GetSections("./views/" + req.body.FileLayout + ".edge", req.body.Id);
        
        // add ads/moduls
        dbcontentsad.reload();
        var adsdataad = dbcontentsad.getData("/");
        adsections.forEach(function(value){
            dbcontentsad.push("/" + adsdataad.length,value, false);
        });
       

        res.json({
            success: req.body.Alias + " created successfully",
            status: 200
        });
    } catch (error) {
        res.json({
            success: req.body.Alias + " - " + error.message,
            status: 500
        });
        console.error(error);
    };
});

// Read
router.get('/Contents/e/:id', function (req, res) {
    dbcontents.reload();
    var addata = dbcontents.getData("/");
    var filterhead = addata.filter(function (value) { return value.HeadId != req.params.id; });

    dbcontentsad.reload();
    var addataAds = dbcontentsad.getData("/");
    var filtered = addataAds.filter(function (value) { return value.HeadId != req.params.id; });
  
    dbheaders.reload();
    var headers = dbheaders.getData("/");
  
    res.render('admin/contentsupdate', {
       title:filterhead[0].Alias,
       id:req.params.id,
       headers:headers,
       ads:"",
       groupids:"",
       pagemoduls:"",
       moduls:""
    });


});

// Save file
router.post('/Contents/e/:id', function (req, res) {


});


// Delete
router.post('/Contents/d/:id', function (req, res) {
    // delete head
    dbcontents.reload();
    var addata = dbcontents.getData("/");
    // find by id
    var result = addata.findIndex(item => item.Id === req.params.id);
    if (result > -1) {
        addata.splice(result, 1);
        dbcontents.push("/", addata);

        // delete head ads      
        dbcontentsad.reload();

        var addataAds = dbcontentsad.getData("/");
        var filtered = addataAds.filter(function (value) { return value.HeadId != req.params.id; });

        dbcontentsad.push("/", filtered);

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



function myAuthorizer(username, password) {
    var configdata = db.getData("/");
    return username === configdata.AdminUser && password === configdata.AdminPWD;
}

module.exports = router;