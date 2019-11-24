var express = require("express"),
    passport = require("passport");
var User = require("../models/user");
var router = express.Router();

router.get("/", function (req, res) {
    res.render("landing")
});

//AUTH ROUTES
router.get("/register", function (req, res) {
    res.render("register", {page: 'register'});
});

router.post("/register", function (req, res) {
    var newUser = new User({username: req.body.username});
    if (req.body.adminCode === 'secret'){
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

router.post("/login", function(req, res, next){
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

module.exports = router;
