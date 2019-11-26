const express     = require("express"),
      Campground  = require("../models/campground"),
      Comment     = require("../models/comment"),
      router      = express.Router({mergeParams: true}),
      middleware  = require("../middleware");


//Create
router.get("/new", middleware.isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/new", {campground: campground});
        }
    })
});

router.post("/", middleware.isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            Comment.create(req.body.comment, function (err, comment) {
                if (err) {
                    req.flash("error", "Something went wrong");
                    console.log(err);
                } else {
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    req.flash("succes", "Successfully added comment!");
                    res.redirect('/campgrounds/' + campground._id);
                }
            });
        }
    })
});

//Edit
router.get("/:comment_id/edit", middleware.checkCommOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        if (err || !foundCampground) {
            req.flash("error", "Campground not found!");
            res.redirect("back")
        }
        Comment.findById(req.params.comment_id, function (err, foundComment) {
            if (err || !foundComment) {
                req.flash("error", "Comment not found!");
                res.redirect("back")
            } else {
                res.render("comments/edit", {campground_id: req.params.id, comment: foundComment})
            }
        })
    });
});

router.put("/:comment_id", middleware.checkCommOwnership, function (req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function (err, updatedComment) {
        if (err) {
            res.redirect("back")
        } else {
            res.redirect("/campgrounds/" + req.params.id)
        }
    })
});

//Delete
router.delete("/:comment_id", middleware.checkCommOwnership, function (req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function (err) {
        if (err) {
            res.redirect("back");
        } else {
            req.flash("succes", "Comment deleted!");
            res.redirect("/campgrounds/" + req.params.id)
        }
    });
});

module.exports = router;
