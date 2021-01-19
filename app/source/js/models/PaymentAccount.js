/** PaymentAccount model.
 **/
'use strict';

var Model = require('./Model');
var ko = require('knockout');

function PaymentAccount(values) {

    Model(this);

    this.model.defProperties({
        userID: '',
        firstName: '',
        lastName: '',
        phone: '',
        streetAddress: '',
        city: '',
        postalCode: '',
        routingNumber: '',
        accountNumber: '',
        stripeNumber: '',
        // Just for form validation purposes only
        accountNumberRepeated: '',
        ssn: '',
        stateProvinceCode: '',
        birthDate: '',
        isVenmo: false,
        isStripe: false,
        agree: false,
        status: '',
        errors: {
            isArray: true
        } // [string]
    }, values);

    /**
     * Whether is a new record, unsaved, or not
     * @member {KnockoutObservable<boolean>}
     */
    this.isNew = ko.pureComputed(function() {
        return !this.status();
    }, this);
    /**
     * Whether the set-up of the account is ready to allow transactions.
     * Strictly, only the status 'active' should be 'ready', but 'pending' takes
     * few time and allow professionals to start accepting payment without have
     * to wait for the formal process; in case it doesn't finished in time
     * or resolves to an invalid state, any payment will fail and other processes
     * notificate it.
     * This mimics the same validation on server.
     * @member {KnockoutObservable<boolean>}
     */
    this.isReady = ko.pureComputed(function() {
        var s = this.status();
        return s && (s === 'active' || s === 'pending') || false;
    }, this);
    /**
     * Whether the account number and the repeated account number are equals.
     * @member {KnockoutObservable<boolean>}
     */
    this.areAccountNumbersEquals = ko.pureComputed(function() {
        var a = this.accountNumber();
        var r = this.accountNumberRepeated();
        return a === r;
    }, this);
}

module.exports = PaymentAccount;
