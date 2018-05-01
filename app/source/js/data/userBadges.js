/**
 * Access lists of badges assigned to the logged user.
 */

import * as badges from './badges';
import CachedDataProvider from './helpers/CachedDataProvider';
import RestItemDataProviderDriver from './helpers/RestItemDataProviderDriver';
import RestSingleDataProviderDriver from './helpers/RestSingleDataProviderDriver';
import flatArray from 'lodash/flatten';
import rest from './drivers/restClient';

const API_NAME_ITEM = 'me/badges';
const API_NAME_LISTING = 'me/badges/by-listing';

/**
 * Fake local driver that does NOT cache.
 * TODO: Implement cache taking care of invalidations and interrelations between indexes and items.
 * There are interelations that make implementing cache difficult here, but in order to keep the same API
 * as when we implement it and follow other data modules design, we use CachedDataProvider instances still.
 */
const noCache = {
    fetch: () => Promise.resolve(undefined),
    push: (data) => Promise.resolve(data),
    delete: () => Promise.resolve()
};

/**
 * Get and manage individual user badges entries.
 * @param {number} id The userBadgeID
 * @returns {CachedDataProvider<rest/UserBadge>}
 * Usage:
 * - const provider = item(userBadgeID);
 * - provider.onData.subscribe(fn) to fetch data, fn keeps being triggered on incoming updated data
 * - provider.onDataError.subscribe(fn) to get notified of errors happening as of onData
 * - provider.onceLoaded().then(..).catch(..) to fetch fresh data, usually slower, good for editors
 * - provider.save(data)
 * - provider.delete()
 */
export function item(id) {
    return new CachedDataProvider({
        // 5 minutes
        ttl: 5 * 60 * 1000,
        remote: new RestItemDataProviderDriver(rest, API_NAME_ITEM, id),
        local: noCache
    });
}

/**
 * Provides access to an API to fetch a specific platform data.
 * @param {number} id The platformID
 * @returns {CachedDataProvider<rest/Platform>}
 * Usage:
 * - const provider = byListing(userListingID);
 * - provider.onData.subscribe(fn) to get the list, fn keeps being triggered on incoming updated data
 * - provider.onDataError.subscribe(fn) to get notified of errors happening as of onData
 */
export function byListing(userListingID) {
    return new CachedDataProvider({
        // 5 minutes
        ttl: 5 * 60 * 1000,
        remote: new RestSingleDataProviderDriver(rest, API_NAME_LISTING + '/' + userListingID),
        local: noCache
    });
}

/**
 * @typedef {Object} UserBadgeAssertion
 * @property {rest/UserBadge} userBadge
 * @property {OpenBadgesV2/Assertion} assertion
 */

/**
 * Given a user badge record, returns an array with all the information for the badge entry and its assertion(s)
 * by loading the badgeURL content, as a pair of data with the userBadge and the
 * OpenBadges assertion.
 * @returns {Promise<Array<UserBadgeAssertion>>}
 */
export function expandUserBadge(userBadge) {
    const userBadgeAndAssertion = (assertion) => ({
        userBadge,
        assertion
    });

    switch (userBadge.type) {
        case 'badge':
            return badges.getAssertion(userBadge.badgeURL).then(userBadgeAndAssertion);
        case 'collection':
            return badges
              .getCollectionAssertions(userBadge.badgeURL)
              .then((list) => list.map(userBadgeAndAssertion));
        default:
            throw new Error(`Unsupported user badge type ${userBadge.type}`);
    }
}

/**
 * Returns the list of OpenBadges assertions that are reference by the given
 * user badges URLs, expanding collections and returning all as a flat array
 * (that contains, each item, the pair of userBadge and OpenBadge assertion).
 * @returns {Promise<Array<UserBadgeAssertion>>}
 */
export function expandUserBadges(userBadgesList) {
    // Load all the assertions for the user badges, expanding collections
    // as individual assertions, and the result as a flat array
    const fetching = userBadgesList.map(expandUserBadge);
    return Promise.all(fetching).then(flatArray);
}
