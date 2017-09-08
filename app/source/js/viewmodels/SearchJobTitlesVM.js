/**
    View Model for the SearchJobTitlesVM component
**/
'use strict';

var SearchResults = require('../models/SearchResults');
var ko = require('knockout');
var user = require('../data/userProfile').data;
var search = require('../data/search');

module.exports = function SearchJobTitlesVM() {
    this.isLoading = ko.observable(false);
    //create an observable variable to hold the search term
    this.searchTerm = ko.observable();
    // Coordinates
    this.lat = ko.observable(search.DEFAULT_LOCATION.lat);
    this.lng = ko.observable(search.DEFAULT_LOCATION.lng);
    this.city = ko.observable();
    this.searchDistance = ko.observable(search.DEFAULT_LOCATION.searchDistance);
    //create an object named SearchResults to hold the search results returned from the API
    this.searchResults = new SearchResults();

    this.loadData = function(searchTerm, lat, lng) {
        this.isLoading(true);

        return search.byTerm(searchTerm, lat, lng)
        .then(function(searchResults) {
            if(searchResults){
                //update searchResults object with all the data from the API
                this.searchResults.model.updateWith(searchResults, true);
            }
            else {
                this.searchResults.model.reset();
            }
            this.isLoading(false);
        }.bind(this))
        .catch(function(err) {
            this.isLoading(false);
            if (err && err.statusText === 'abort') return null;
        }.bind(this));
    };
    //creates a handler function for the html search button (event)
    this.search = function() {
        //creates a variable for the search term to check to see when a user enters more than 2 characters, we'll auto-load the data.
        var s = this.searchTerm();
        if(s && s.length > 2) {
            this.loadData(s, this.lat(), this.lng());
        }
        else {
            this.searchResults.model.reset();
        }
    };
    //anything that happens in the computed function after a timeout of 60 seconds, run the code
    ko.computed(function() {
        this.search();
    //add ",this" for ko.computed functions to give context, when the search term changes, only run this function every 60 milliseconds
    },this).extend({ rateLimit: { method: 'notifyAtFixedRate', timeout: 300 } });

    this.isInput = ko.pureComputed(function() {
        var s = this.searchTerm();
        return s && s.length > 2;
    }, this);

    this.onClickJobTitle = function() {};
    this.clickJobTitle = function(d, e) {
        try {
            this.onClickJobTitle(d, e);
        }
        catch(ex) {}
        // Close suggestions
        this.searchTerm('');
    }.bind(this);

    this.onClickNoJobTitle = function() {};
    this.clickNoJobTitle = function(d, e) {
        try {
            this.onClickNoJobTitle(this.searchTerm(), e);
        }
        catch(ex) {}
        // Close suggestions
        this.searchTerm('');
    }.bind(this);

    this.jobTitleHref = ko.observable('');
    this.noJobTitleHref = ko.observable('');

    // Configurable per use case, or automatic if empty
    this.customResultsButtonText = ko.observable('');

    this.resultsButtonText = ko.pureComputed(function() {
        var t = this.customResultsButtonText();
        if (t) return t;
        var anon = user.isAnonymous();
        return anon ? 'Sign up' : 'Add';
    }, this);

    this.thereAreJobTitles = ko.pureComputed(function() {
        var jts = this.searchResults.jobTitles();
        return jts.length > 0;
    }, this);
};
