/**
    ContactForm activity
**/
'use strict';

var Activity = require('../components/Activity');
var VocElementEnum = require('../models/VocElementEnum');
var onboarding = require('../data/onboarding');
var feedback = require('../data/feedback');
var showError = require('../modals/error').show;

var A = Activity.extend(function ContactFormActivity() {

    Activity.apply(this, arguments);

    this.viewModel = new ViewModel(this.app);

    this.accessLevel = null;

    this.navBar = Activity.createSubsectionNavBar('Back');
    this.navBar.rightAction(null);
    this.title('Contact us');
});

exports.init = A.init;

A.prototype.show = function show(options) {
    /* eslint complexity:"off" */
    Activity.prototype.show.call(this, options);

    var params = this.requestData.route.segments || [];
    var elementName = params[0] || '';
    var elementID = VocElementEnum[elementName] |0;

    this.viewModel.emailSubject(this.requestData.route.query.subject || '');
    this.viewModel.message(this.requestData.route.query.body || this.requestData.route.query.message || '');

    if (!elementName) {
        console.warn('Feedback Support: Accessing without specify an element, using General (0)');
    }
    else if (!VocElementEnum.hasOwnProperty(elementName)) {
        console.error('Feedback Support: given a bad VOC Element name:', elementName);
    }

    this.viewModel.vocElementID(elementID);
};

var ko = require('knockout');
var user = require('../data/userProfile').data;

function ViewModel(app) {

    this.isInOnboarding = onboarding.inProgress;
    this.message = ko.observable('');
    this.isSending = ko.observable(false);
    this.vocElementID = ko.observable(0);
    this.emailSubject = ko.observable('');

    this.submitText = ko.pureComputed(function() {
        return this.isSending() ? 'Sending..' : 'Send';
    }, this);

    this.isValid = ko.pureComputed(function() {
        var m = this.message();
        return m && !/^\s*$/.test(m);
    }, this);

    this.anonymousButtonUrl = ko.pureComputed(function() {
        if (!user.isAnonymous()) return '';

        var subject = encodeURIComponent(this.emailSubject() || 'I need help!');
        var body = encodeURIComponent(this.message());
        var url = 'mailto:support@loconomics.com.au?subject=' + subject + '&body=' + body;
        return url;
    }, this);

    this.send = function send() {
        // Check is valid, and do nothing if not
        if (!this.isValid() || user.isAnonymous()) {
            return;
        }
        this.isSending(true);
        var msg = this.message();
        if (this.emailSubject()) {
            msg = this.emailSubject() + ': ' + msg;
        }
        feedback.postSupport({
            message: msg,
            vocElementID: this.vocElementID()
        })
        .then(function() {
            // Success
            app.successSave({
                message: 'Thank you, we\'ll be in touch soon!'
            });
            // Reset after being sent
            this.message('');
        }.bind(this))
        .catch(function(err) {
            showError({
                title: 'There was an error sending your feedback',
                error: err
            });
        })
        .then(function() {
            // Always
            this.isSending(false);
        }.bind(this));
    }.bind(this);
}
