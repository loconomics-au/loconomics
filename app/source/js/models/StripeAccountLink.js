/** PaymentAccount model.
 **/
'use strict';

var Model = require('./Model');
var ko = require('knockout');

function StripeAccountLink(values) {

    Model(this);

    this.model.defProperties({
        url: '',
        status: ''
    }, values);
    
    /**
     * Whether is a new record, unsaved, or not
     * @member {KnockoutObservable<boolean>}
     */
    this.isNew = ko.pureComputed(function() {
        return !this.status();
    }, this);
}

module.exports = StripeAccountLink;
