require('dotenv').config();
// require('bootstrap');
const express = require("express"),
      app = express(),
      bodyParser = require("body-parser"),
      port = 3000,
      mongoose = require("mongoose"),
      flash = require("connect-flash"),
      Campground = require("./models/campground"),
      Comment = require("./models/comment"),
      User = require("./models/user"),
      Notification = require("./models/notification"),
      seedDB = require("./seeds"),
      passport = require("passport"),
      LocalStrategy = require("passport-local"),
      passportLocalMongoose = require("passport-local-mongoose"),
      methodOverride = require("method-override");

const commentRoute = require("./routes/comments"),
      campgroundsRoute = require("./routes/campgrounds"),
      authRoute = require("./routes/auth"),
      profileRoute = require("./routes/profile"),
      notificationsRoute = require("./routes/notifications");

app.locals.moment = require('moment');

mongoose.connect("mongodb://localhost/yelp_camp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

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

app.use(async function (req, res, next) {
    res.locals.currentUser = req.user;
    if(req.user) {
        try {
            let user = await User.findById(req.user._id).populate('notifications', null, { isRead: false }).exec();
            res.locals.notifications = user.notifications.reverse();
        } catch(err) {
            console.log(err.message);
        }
    }
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next()
});

app.use("/campgrounds/:id/comments", commentRoute);
app.use("/campgrounds", campgroundsRoute);
app.use("/", authRoute);
app.use("/users", profileRoute);
app.use("/notifications", notificationsRoute);

// seedDB();

app.listen(port, process.env.IP, function () {
    console.log("The yelp server has started on port 3000!")
});
