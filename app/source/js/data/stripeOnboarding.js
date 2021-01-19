/**
 * Onboarding process for Stripe accounts
 * (just for service professionals,
 * is the account they will get paid for services),
 * local and remote.
 */
'use strict';

var StripeAccountLink = require('../models/StripeAccountLink');
var RemoteModel = require('./helpers/RemoteModel');
var session = require('./session');
var remote = require('./drivers/restClient');

var api = new RemoteModel({
    data: new StripeAccountLink(),
    ttl: { minutes: 1 },
    localStorageName: 'stripeAccountLink',
    push: function post(data) {
        return remote.post('me/stripe-onboarding', data || this.data.model.toPlainObject());
    }
});
module.exports = api;

session.on.cacheCleaningRequested.subscribe(function() {
    api.clearCache();
});
