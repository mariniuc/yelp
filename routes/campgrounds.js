const express    = require("express"),
      router     = express.Router(),
      Campground = require("../models/campground"),
      middleware = require("../middleware"),
      mbxClient  = require('@mapbox/mapbox-sdk/services/geocoding');

require('dotenv').config();

const geocodingClient = mbxClient({accessToken: process.env.MAPBOX_TOKEN});

router.get("/", function (req, res) {
    Campground.find({}, function (err, campgrounds) {
        if (err) {
            console.log(err);
        } else {
            res.render("campgrounds/index", {campgrounds: campgrounds, page: 'campgrounds'});
        }
    })
});

router.get("/new", middleware.isLoggedIn, function (req, res) {
    res.render("campgrounds/new")
});

//CREATE
router.get("/:id", function (req, res) {
    Campground.findById(req.params.id).populate("comments").exec(function (err, foundCampground) {
        if (err || !foundCampground) {
            req.flash("error", "Campground not found");
            console.log(err);
            res.redirect("back");
        } else {
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

router.post("/", middleware.isLoggedIn, async function (req, res) {
    const name = req.body.name;
    const image = req.body.image;
    const description = req.body.description;
    const price = req.body.price;
    const author = {
        id: req.user._id,
        username: req.user.username
    };
    const location = req.body.location;
    let coordinates = await getCoordinates(location);
    const newCampground = {
        name: name,
        image: image,
        description: description,
        price: price,
        author: author,
        location: location,
        coordinates: coordinates
    };
    Campground.create(newCampground, function (err, newlyCreated) {
        if (err) {
            console.log(err);
        } else {
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
});

//EDIT
router.get("/:id/edit", middleware.checkCampOwnership, function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        res.render("campgrounds/edit", {campground: foundCampground})
    })
});

router.put("/:id/", middleware.checkCampOwnership, async function (req, res) {
    let coordinates = await getCoordinates(req.body.campground.location);
    req.body.campground.coordinates = coordinates;
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function (err, updatedCampground) {
        if (err) {
            res.redirect("/campgrounds")
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
});

//DELETE
router.delete("/:id", middleware.checkCampOwnership, function (req, res) {
    Campground.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            res.redirect("/campgrounds")
        } else {
            res.redirect("/campgrounds")
        }
    })
});

async function getCoordinates(location) {
    let coords;
    await geocodingClient.forwardGeocode({
        query: location,
        limit: 1
    }).send()
        .then(response => {
                console.log(response.body.features[0].geometry.coordinates);
                coords = response.body.features[0].geometry.coordinates;
            },
        );
    return coords;
}

module.exports = router;
