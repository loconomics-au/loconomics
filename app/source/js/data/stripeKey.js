/**
 * Public Key for Stripe 
 * local and remote.
 */
'use strict';

var remote = require('./drivers/restClient');

exports.getPublicKey = function getPublicKey()
{
    return remote.get('stripe-key');
};