const express = require("express"),
    router = express.Router(),
    Campground = require("../models/campground"),
    middleware = require("../middleware"),
    mbxClient = require('@mapbox/mapbox-sdk/services/geocoding');

const multer = require('multer');

const storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname)
    }
});


//IMAGE UPLOAD CONFIG
const imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed'), false)
    }
    cb(null, true)
};

const upload = multer({storage: storage, fileFilter: imageFilter});

const cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: 'mariniuccloud',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//MAPBOX TOKEN
const geocodingClient = mbxClient({accessToken: process.env.MAPBOX_TOKEN});

//GET ALL CAMPS
router.get("/", function (req, res) {
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}, function (err, campgrounds) {
            if (err) {
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: campgrounds, page: 'campgrounds'});
            }
        })
    } else {
        Campground.find({}, function (err, campgrounds) {
            if (err) {
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: campgrounds, page: 'campgrounds'});
            }
        })
    }
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

router.post("/", middleware.isLoggedIn, upload.single('image'), async function (req, res) {
    const name = req.body.name;
    console.log(req.body);

    let image = await cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        req.body.image = result.secure_url
    });
    const description = req.body.description;
    const price = req.body.price;
    const author = {
        id: req.user._id,
        username: req.user.username
    };
    const location = req.body.location;
    let coordinates = await getCoordinates(location).catch(() => {
        console.log('error in fetching coordinates');
    });
    const newCampground = {
        name: name,
        image: image,
        description: description,
        price: price,
        author: author,
        location: location,
        coordinates: coordinates
    };
    console.log(newCampground);
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

router.put("/:id/", middleware.checkCampOwnership, upload.single('image'), async function (req, res) {
    req.body.campground.coordinates = await getCoordinates(req.body.campground.location);
    Campground.findById(req.params.id, req.body.campground, async function (err, campground) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/campgrounds")
        } else {
            if (req.file) {
                console.log(req.file);
                try {
                    await cloudinary.v2.uploader.destroy(campground.image.public_id);
                    const result = await cloudinary.v2.uploader.upload(req.file.path);
                    campground.image.public_id = result.public_id;
                    campground.image.url = result.secure_url;
                } catch (err) {
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            }
            campground.save();
            req.flash("success", "Successfully Updated!");
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
});

//DELETE
router.delete("/:id", middleware.checkCampOwnership, function (req, res) {
    Campground.findById(req.params.id, async function (err, campground) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/campgrounds")
        }
        try {
            await cloudinary.v2.uploader.destroy(campground.image.public_id);
            campground.remove();
            req.flash('success', 'Campground deleted successfully!');
            res.redirect('/campgrounds');
        } catch (err) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("/campgrounds")
            }
        }
    })
});

//MAPBOX GET COORDINATES
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

//REGEX FOR SEARCH
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;
