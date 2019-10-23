var express               = require("express"),
    app                   = express(),
    bodyParser            = require("body-parser"),
    port                  = 3000,
    mongoose              = require("mongoose"),
    Campground            = require("./models/campground"),
    Comment               = require("./models/comment"),
    User                  = require("./models/user"),
    seedDB                = require("./seeds"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    methodOverride        = require("method-override");

var commentRoute          = require("./routes/comments"),
    campgroundsRoute      = require("./routes/campgrounds"),
    authRoute             = require("./routes/auth");

mongoose.connect("mongodb://localhost/yelp_camp", {useNewUrlParser: true});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));

//PASSPORT CONFIG
app.use(require("express-session")({
    secret: "My secret is secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    next()
});

app.use("/campgrounds/:id/comments", commentRoute);
app.use("/campgrounds", campgroundsRoute);
app.use("/", authRoute);
// seedDB();

app.listen(port, process.env.IP, function () {
    console.log("The yelp server has started on port 3000!")
});
