'use strict';
// IMPORTANT: it requires access to DOM with jQuery in order to the COPY LINK to work on browsers
var ko = require('knockout');
var clipboard = require('../utils/clipboard');
var listing = require('../data/marketplaceProfile');
var showError = require('../modals/error').show;

module.exports = function ListingVM(app) {
    var profileVersion = listing.newVersion();
    profileVersion.isObsolete.subscribe(function(itIs) {
        if (itIs) {
            // new version from server while editing
            // FUTURE: warn about a new remote version asking
            // confirmation to load them or discard and overwrite them;
            // the same is need on save(), and on server response
            // with a 509:Conflict status (its body must contain the
            // server version).
            // Right now, just overwrite current changes with
            // remote ones:
            profileVersion.pull({ evenIfNewer: true });
        }
    });

    // Actual data for the form:
    this.profile = profileVersion.version;

    this.isLoading = listing.isLoading;
    this.isSaving = listing.isSaving;
    this.isLocked = listing.isLocked;

    this.discard = function discard() {
        profileVersion.pull({ evenIfNewer: true });
        this.copyCustomUrlButtonText('Copy');
    }.bind(this);

    this.save = function save() {
        return profileVersion.pushSave()
        .then(function() {
            app.successSave();
        })
        .catch(function(error) {
            this.app.modals.showError({
                title: 'Unable to save your data.',
                error: error
            });
        });
    };
    this.sync = function() {
        this.discard();
        return listing.load()
        .catch(function(error) {
            this.app.modals.showError({
                title: 'Unable to load your data.',
                error: error
            });
        });
    };

    /// Utilities
    // Custom URL
    this.customUrlProtocol = ko.observable('https://');
    this.customUrlDomainPrefix = ko.observable('www.loconomics.com/-');
    /**
        Autogenerated custom URL for the current 'draft' data (being edited by the user)
    **/
    this.customUrlDraft = ko.pureComputed(function() {
        return this.customUrlProtocol() + this.customUrlDomainPrefix() + this.profile.serviceProfessionalProfileUrlSlug();
    }, this);
    // Copy Custom URL
    this.copyCustomUrlButtonText = ko.observable("Copy your listing's URL");
    this.profile.serviceProfessionalProfileUrlSlug.subscribe(function() {
        // On any change, restore copy label
        this.copyCustomUrlButtonText("Copy your listing's URL");
    }.bind(this));
    this.copyCustomUrl = function() {
        var url = this.customUrlDraft();
        var errMsg = clipboard.copy(url);
        if (errMsg) {
            showError({ error: errMsg });
        }
        else {
            this.copyCustomUrlButtonText('Copied!');
        }
    }.bind(this);
    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ?
                'Loading...' :
                this.isSaving() ?
                    'Saving...' :
                    'Save'
        );
    }, this);
};
