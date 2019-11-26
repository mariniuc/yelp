const express  = require("express"),
      passport = require("passport"),
      User     = require("../models/user"),
      async    = require("async"),
      nodemailer = require("nodemailer"),
      crypto = require("crypto"),
      router   = express.Router();

router.get("/", function (req, res) {
    res.render("landing")
});

//AUTH ROUTES
router.get("/register", function (req, res) {
    res.render("register", {page: 'register'});
});

router.post("/register", function (req, res) {
    const newUser = new User({
          username: req.body.username,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          avatar: req.body.avatar
    });
    // eval(require('locus'));
    if (req.body.adminCode === 'secret') {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "Welcome to YelpCamp " + req.body.username);
            res.redirect("/campgrounds")
        })
    })
});

router.get("/login", function (req, res) {
    res.render("login", {page: 'login'})
});

router.post("/login", function (req, res, next) {
    passport.authenticate("local", {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
        failureFlash: true,
        successFlash: "Welcome to YelpCamp, " + req.body.username + "!"
    })(req, res);
});

router.get("/logout", function (req, res) {
    req.logOut();
    req.flash("success", "You are logged out!");
    res.redirect("/campgrounds");
});

//PASSWORD RESET
router.get('/forgot', function (req, res) {
   res.render('users/forgot');
});

router.post('/forgot', function (req, res, next) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                const token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({email: req.body.email}, function (err, user) {
                if (!user){
                    req.flash('error', 'No account with that email adress exists.');
                    return res.redirect('/forgot')
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000;

                user.save(function (err) {
                    done(err, token, user);
                })
            })
        },
        function (token, user, done) {
            const smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'mariniuc13dan@gmail.com',
                    pass: 'Blitzkrieg13'
                }
            });
            const mailOptions = {
                to: user.email,
                from: 'mariniuc13dan@gmail.com',
                subject: 'YelpCamp Password Reset',
                text: 'Reset Password: ' + 'http://' + req.headers.host + '/reset/' + token
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                console.log('mail sent');
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions!');
                done(err, 'done')
            });
        }
    ], function (err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});

router.get('/reset/:token', function (req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, function (err, user) {
        if (!user) {
            req.flash('error', 'Password reset token is invalid or expired!');
            return res.redirect('/forgot');
        }
        res.render('users/reset', {token: req.params.token});
    })
});

router.post('/reset/:token', function (req, res) {
    async.waterfall([
       function (done) {
           User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, function (err, user) {
               if (!user) {
                   req.flash('error', 'Password reset token is invalid or expired!');
                   return res.redirect('back');
               }
               if (req.body.password === req.body.confirmPassword){
                   user.setPassword(req.body.password, function(err){
                       user.resetPasswordExpires = undefined;
                       user.resetPasswordToken = undefined;

                       user.save(function (err) {
                           req.logIn(user, function (err) {
                               done(err, user);
                           });
                       });
                   })
               } else {
                   req.flash('error', 'Password does not match!');
                   return res.redirect('back');
               }
           });
       },
        function (user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'mariniuc13dan@gmail.com',
                    pass: 'Blitzkrieg13'
                }
            });
            const mailOptions = {
                to: user.email,
                from: 'mariniuc13dan@gmail.com',
                subject: 'YelpCamp Password Reset',
                text: 'Password for this account: ' + user.email + ' has just been changed!'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                req.flash('success', 'Success! Your password has been changed.');
                done(err, 'done')
            });
        }
    ], function (err) {
        res.redirect('/campgrounds')
    });
});

module.exports = router;
