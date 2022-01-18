var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    JsonDB = require('node-json-db'),
    db = new JsonDB(`${__base}db/config`, true, false);

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (id, done) {
    db.reload();
    var configdata = db.getData("/");
    done(null, configdata.AdminUser);
});

passport.use('local.signin', new LocalStrategy({
    usernameField: 'emaillogin',
    passwordField: 'passwordlogin',
    passReqToCallback: true
}, function (req, email, password, done) {
    db.reload();
    req.checkBody('emaillogin', 'Invalid Email').notEmpty().isEmail();
    req.checkBody('passwordlogin', 'Too short password.Password is min 4 char').notEmpty().isLength({ min: 4 });
    var errors = req.validationErrors();
    var messages = [];
    if (errors) {

        errors.forEach(function (error) {
            messages.push(error.msg);
        });
        return done(null, false, req.flash('error', messages));
    }
    var configdata = db.getData("/");
    if (email != configdata.AdminUser) {
        messages.push('No user found.');
        return done(null, false, req.flash('error', messages));
    }
    if (password != configdata.AdminPWD) {
        messages.push('Wrong password.');
        return done(null, false, req.flash('error', messages));
    }
    return done(null, configdata.AdminUser);
}));
