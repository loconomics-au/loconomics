/**
 * Lets edit info about the user set-up for payment 'venmo'.
 * @module kocomponents/payout-stripe-editor
 */
'use strict';

var TAG_NAME = 'payout-stripe-editor';
var template = require('./template.html');

var ko = require('knockout');
var stripeOnboarding = require('../../../data/stripeOnboarding');
var showError = require('../../../modals/error').show;

/**
 *
 * @class
 * @param {Object} params
 * @param {models/PaymentAccount} params.data Data to display
 */
function ViewModel(params) {
    /**
     * Component was disposed (removed and waiting from GC)
     * @member {KnockoutObservable<boolean>}
     */
    this.isDisposed = ko.observable(false);
    /**
     * Data to edit
     * @member {models/PaymentAccount}
     */
    this.data = ko.unwrap(params.data);
    /**
     * When a saving request it's on the works
     * @member {KnockoutObservable<boolean>}
     */
    this.isSaving = ko.observable(false);

    /**
     * When edition must be locked because of in progress operations
     * @member {KnockoutComputed<boolean>}
     */
    this.isLocked = ko.pureComputed(function() {
        return this.isSaving();
    }, this);
    /**
     * Label for the submit/save button; it changes based on state.
     * @member {KnockoutComputed<string>}
     */
    this.submitText = ko.pureComputed(function() {
        return this.isSaving() ?
            'opening...' :
            'Setup payouts on Stripe';
    }, this);

    /**
     * Tag instance as disposed to prevent pending async task from wasting time.
     * Is called automatically by KO
     */
    this.dispose = function() {
        this.isDisposed(true);
    };

    this.onSaved = ko.unwrap(params.onSaved);

    this.save = function save() {
        this.isSaving(true);
        // Save
        var data = this.data.model.toPlainObject();
        data.isStripe = true;
        stripeOnboarding.save(data)
        .then(function(serverData) {
            this.isSaving(false);
            if (this.isDisposed()) return;

            if (this.onSaved) {
                this.onSaved();
            }

            if (serverData.url()) {
                window.location = serverData.url();
            }
        }.bind(this))
        .catch(function(error) {
            this.isSaving(false);

            if (this.isDisposed()) return;

            showError({
                title: 'Error saving your payout preference',
                error: error
            });
        }.bind(this));
    }.bind(this);
}

ko.components.register(TAG_NAME, {
    template: template,
    viewModel: ViewModel
});
