const express = require("express"),
    User = require("../models/user"),
    middleware = require("../middleware"),
    router = express.Router();
    Notification = require("../models/notification");

router.get('/users/:id', async function (req, res) {
    try {
        let user = await User.findById(req.params.id).populate('followers').exec();
        res.render('users/show', {user});
    } catch (err) {
        req.flash('error', err.message);
        return res.redirect('back');
    }
});

router.get("/follow/:id", middleware.isLoggedIn, async function (req, res) {
    try {
        let user = await User.findById(req.params.id);
        user.followers.push(req.user._id);
        user.save();
        req.flash('success', 'Successfully followed ' + user.username + '!');
        res.redirect('/users/' + req.params.id);
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('back');
    }
});
router.get('/:id', middleware.isLoggedIn, async function (req, res) {
    try {
        let notification = await Notification.findById(req.params.id);
        notification.isRead = true;
        notification.save();
        res.redirect(`/campgrounds/${notification.campground_id}`)
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('back');
    }
});

router.get('/', middleware.isLoggedIn, async function (req, res) {
    try {
        let user = await User.findById(req.user._id).populate({
            path: 'notifications',
            options: {sort: {"_id": -1}}
        }).exec();
        let allNotifications = user.notifications;
        res.render('notifications/index', {allNotifications})
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('back');
    }
});

module.exports = router;
