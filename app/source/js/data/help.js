/**
 * Access to the help and FAQs articles,
 * from remote Zendesk REST API.
 *
 * NOTE: It's different from other data modules since does not use the common
 * rest client (that one is preset with our webservice endpoint and credentials,
 * this requires different set-up).
 */
// TODO jsdocs
'use strict';
var ko = require('knockout');
var session = require('./session');
var remote = require('./drivers/restClient');
// TODO Replace direct jquery.ajax call with a specialized Rest instance
// under ./drivers, like 'zendeskRestClient'?
var $ = require('jquery');

var articlesUrl = 'help/articles';
var categoriesUrl = 'help/categories';
var sectionsUrl = 'help/sections';

function getArticlesUrl(labels) {
    return articlesUrl + encodeURIComponent(labels);
}

function getRemoteArticles(labels) {
    var result = [];

    return remote.get(getArticlesUrl(labels)).then(function next(data) {
        if (data)
            result = result.concat(data);
        if (data.next_page)
            return $.get(data.next_page).then(next);
        else
            return result;
    });
}
function getRemoteCategories() {
    var result = [];

    return remote.get(categoriesUrl).then(function next(data) {
        if (data)
            result = result.concat(data);
        if (data.next_page)
            return $.get(data.next_page).then(next);
        else
            return result;
    });
}
function getRemoteSections() {
    var result = [];
    return remote.get(sectionsUrl).then(function next(data) {
        if (data)
            result = result.concat(data);
        if (data.next_page)
            return $.get(data.next_page).then(next);
        else
            return result;
    });
}

var CacheControl = require('./helpers/CacheControl');

/// The in-memory cache
var ttl = { days: 1 };
var cache = {
    categories: new CacheControl({ ttl: ttl }),
    sections: new CacheControl({ ttl: ttl }),
    articles: { /*CacheControl by labels*/ },
    clear: function() {
        this.categories.reset();
        this.categories.data = null;
        this.sections.reset();
        this.sections.data = null;
        this.articles = {};
    },
    getArticlesCache: function(labels) {
        var cacheItem = this.articles[labels];
        if (!cacheItem) {
            cacheItem = this.articles[labels] = new CacheControl({ ttl: ttl });
        }
        return cacheItem;
    },
    setArticles: function(labels, data) {
        var cacheItem = this.getArticlesCache(labels);
        // If didn't exist, it was already created by the previous call
        // just update data and time
        cacheItem.data = data;
        cacheItem.latest = new Date();
        return cacheItem;
    }
};

exports.clearCache = function() {
    cache.clear();
};

session.on.cacheCleaningRequested.subscribe(function() {
    exports.clearCache();
});

// Collections

var HelpCategory = require('../models/HelpCategory');
exports.isLoadingCategories = ko.observable(false);
exports.getCategories = function() {
    if (cache.categories.mustRevalidate()) {
        exports.isLoadingCategories(true);
        return getRemoteCategories().then(function(data) {
            cache.categories.data = data.map(function(a) {
                return new HelpCategory(a);
            });
            cache.categories.latest = new Date();
            exports.isLoadingCategories(false);
            return cache.categories.data;
        }, function(err) {
            exports.isLoadingCategories(false);
            throw err;
        });
    }
    else {
        return Promise.resolve(cache.categories.data);
    }
};

var HelpSection = require('../models/HelpSection');
exports.isLoadingSections = ko.observable(false);
exports.getSections = function() {
    if (cache.sections.mustRevalidate()) {
        exports.isLoadingSections(true);
        return getRemoteSections().then(function(data) {
            cache.sections.data = data.map(function(a) {
                return new HelpSection(a);
            });
            cache.sections.latest = new Date();
            exports.isLoadingSections(false);
            return cache.sections.data;
        }, function(err) {
            exports.isLoadingSections(false);
            throw err;
        });
    }
    else {
        return Promise.resolve(cache.sections.data);
    }
};

var HelpArticle = require('../models/HelpArticle');
exports.isLoadingArticles = ko.observable(false);
exports.getArticles = function(labels) {
    labels = labels || '';
    var cached = cache.getArticlesCache(labels);

    if (cached.mustRevalidate()) {
        exports.isLoadingArticles(true);
        return getRemoteArticles(labels).then(function(data) {
            cache.setArticles(labels, data.map(function(a) {
                return new HelpArticle(a);
            }));
            exports.isLoadingArticles(false);
            return cached.data;
        }, function(err) {
            exports.isLoadingArticles(false);
            throw err;
        });
    }
    else {
        return Promise.resolve(cached.data);
    }
};

// Items
// TODO Implement a cache for found by ID? Or create cache for all once data is loaded?
exports.findByIdAt = function(id, atList) {
    var found;
    atList.some(function(item) {
        if (item.id() == id) {
            found = item;
            return true;
        }
    });
    return found;
};

exports.getCategory = function(id) {
    return exports.getCategories().then(function(list) {
        return exports.findByIdAt(id, list);
    });
};
exports.getSection = function(id) {
    return exports.getSections().then(function(list) {
        return exports.findByIdAt(id, list);
    });
};
exports.getArticle = function(id) {
    return exports.getArticles().then(function(list) {
        return exports.findByIdAt(id, list);
    });
};

exports.getArticlesBySection = function(sectionID) {
    return exports.getArticles().then(function(list) {
        return list.filter(function(item) {
            return item.section_id() == sectionID;
        });
    });
};

exports.getSectionsByCategory = function(categoryID) {
    return exports.getSections().then(function(list) {
        return list.filter(function(item) {
            return item.category_id() == categoryID;
        });
    });
};

exports.useHelp = function() {
    // disable help (zendesk not currently available)
    return true;
};
