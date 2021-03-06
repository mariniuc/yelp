var Campground = require("../models/campground");
var Comment = require("../models/comment");

var middlewareObj = {};

middlewareObj.checkCampOwnership = function(req, res, next){
    if (req.isAuthenticated()) {
        Campground.findById(req.params.id, function (err, foundCampground) {
            if (err || !foundCampground) {
                req.flash("error", "Campground not found!");
                res.redirect("back")
            } else {
                if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to edit!");
                    res.redirect("back")
                }
            }
        })
    } else {
        req.flash("error", "Please Login!");
        res.redirect("back")
    }
};

middlewareObj.checkCommOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function (err, foundComment) {
            if (err || !foundComment) {
                req.flash("error", "Comment not found!");
                res.redirect("back")
            } else {
                if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have permission!");
                    res.redirect("back")
                }
            }
        })
    } else {
        req.flash("error", "Please Login!");
        res.redirect("back")
    }
};

middlewareObj.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "Please Login First!");
    res.redirect("/login")
};

module.exports = middlewareObj;
