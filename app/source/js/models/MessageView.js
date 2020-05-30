/** Message model.

    Describes a message from a MailFolder.
    A message could be of different types,
    as inquiries, bookings, booking requests.
 **/
'use strict';

var ko = require('knockout');
var Model = require('./Model');
var moment = require('moment');
var PublicUserProfile = require('./PublicUserProfile');
var user = require('../data/userProfile').data;
var users = require('../data/users');

function MessageView(values, app) {

    Model(this);

    this.model.defProperties({
        id: 0,
        createdDate: null,
        updatedDate: null,

        subject: '',
        content: null,
        link: '#',

        tag: '',
        classNames: '',

        sourceThread: null,
        sourceMessage: null

    }, values);

    // Smart visualization of date and time
    this.displayedDate = ko.pureComputed(function() {

        return moment(this.createdDate()).locale('en-US-LC').calendar();

    }, this);

    this.displayedTime = ko.pureComputed(function() {

        return moment(this.createdDate()).locale('en-US-LC').format('LT');

    }, this);

    this.quickDateTime = ko.pureComputed(function() {
        var date = this.createdDate();

        var m = moment(date).locale('en-US-LC');
        var t = moment().startOf('day');

        if (m.isAfter(t)) {
            return m.format('LT');
        }
        else {
            return m.fromNow();
        }
    }, this);

    var getUserData = function(userID) {
        if (userID) {
            if (userID === user.userID())
                return user;
            else {
                var publicUser = new PublicUserProfile();
                users.getProfile(userID).then(function(d) { publicUser.model.updateWith(d, true); });
                return publicUser;
            }
        }
        // Message from the System
        return new PublicUserProfile({
            firstName: 'Loconomics',
            lastName: 'Australia Inc.'
        });
    };

    this.client = ko.pureComputed(function() {
        var t = this.sourceThread();
        if (!t || !app) return null;
        return getUserData(t.clientUserID());
    }, this)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });

    this.serviceProfessional = ko.pureComputed(function() {
        var t = this.sourceThread();
        if (!t || !app) return null;
        return getUserData(t.serviceProfessionalUserID());
    }, this)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });

    this.sender = ko.pureComputed(function() {
        var m = this.sourceMessage();
        if (!m || !app) return null;
        return getUserData(m.sentByUserID());
    }, this)
    .extend({ rateLimit: { method: 'notifyWhenChangesStop', timeout: 20 } });
}

module.exports = MessageView;

/**
    Creates a MessageView instance from a Thread instance.
    It's better to have almost one message in the thread (the latest
    one first, or the one to highlight) to build a
    more detailed MessageView
**/
MessageView.fromThread = function(app, thread) {

    var msg = thread.messages();
    msg = msg && msg[0] || null;

    var tag;
    var  classNames;
    if (msg) {
        // TODO: more different tag/classes depending on booking state as per design
        // NOTE: That requires to load the booking or request by auxID and wait for it
        if (msg.auxT() === 'Booking') {
            tag = 'Booking';
            classNames = 'text-success';
        }
        // TODO For state==request must be
        /*{
            tag = 'Booking request';
            classNames = 'text-warning';
        }*/
    }
    else {
        // Problem if msg is null, since almost one message must exists on every thread
        console.error('Thread is empty', thread);
    }

    return new MessageView({
        sourceThread: thread,
        sourceMessage: msg,
        id: thread.threadID(),
        createdDate: thread.createdDate(),
        updatedDate: thread.updatedDate(),
        subject: thread.subject(),
        content: msg && msg.bodyText() || '',
        link: '#!/conversation/' + thread.threadID(),
        tag: tag,
        classNames: classNames
    }, app);
};
