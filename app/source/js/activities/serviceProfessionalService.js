/**
    ServiceProfessional Service activity
**/
'use strict';

import { item as getUserListing } from '../data/userListings';

var ko = require('knockout');
var Activity = require('../components/Activity');
var ServiceProfessionalServiceViewModel = require('../viewmodels/ServiceProfessionalService');
var $ = require('jquery');
var RouteMatcher = require('../utils/Router').RouteMatcher;
var Route = require('../utils/Router').Route;
var serviceListGroupFactories = require('../viewmodels/ServiceListGroupFactories');
var onboarding = require('../data/onboarding');
var clients = require('../data/clients');
var serviceProfessionalServices = require('../data/serviceProfessionalServices');
var DEFAULT_BACK_LINK = '/listingEditor';
var showError = require('../modals/error').show;
var Client = require('../models/Client').default;

var A = Activity.extend(function ServiceProfessionalServiceActivity() {

    Activity.apply(this, arguments);

    this.accessLevel = this.app.UserType.serviceProfessional;
    this.viewModel = new ViewModel(this.app);
    // Defaults settings for navBar.
    this.navBar = Activity.createSubsectionNavBar('Job Title', {
        backLink: DEFAULT_BACK_LINK,
        helpLink: this.viewModel.helpLink
    });
    // Save defaults to restore on updateNavBarState when needed:
    this.defaultLeftAction = this.navBar.leftAction().model.toPlainObject(true);
    // Make navBar available at viewModel, needed for dekstop navigation
    this.viewModel.navBar = this.navBar;
    this.title = ko.pureComputed(function() {
        if (this.isInOnboarding() && this.listingTitle()) {
            return 'Add your first ' + this.listingTitle() + ' offering';
        }
        else if (this.listingTitle() && !this.isSelectionMode()) {
            return this.listingTitle() + ' offerings';
        }
        else if (this.listingTitle() && this.isSelectionMode()) {
            return "What's included in " + this.clientName() + "'s " + this.listingTitle() + ' appointment?';
        }
        else {
            return 'Select a job title';
        }
    }, this.viewModel);

    this.registerHandler({
        target: this.viewModel.clientID,
        handler: function(clientID) {
            var viewModel = this.viewModel;

            viewModel.client(null);

            if(clientID) {
                clients
                .item(clientID)
                .onceLoaded()
                .then(function(client) {
                    viewModel.client(new Client(client));
                })
                .catch(function(error) {
                    showError({ title: 'Unable to load client.', error: error });
                });
            }
        }.bind(this)
    });

    this.registerHandler({
        target: this.viewModel.client,
        handler: function() {
            // Update navbar (may include the client name)
            this.updateNavBarState();
        }.bind(this)
    });

    // Go back with the selected pricing when triggered in the form/view
    this.viewModel.returnSelected = function(pricing, jobTitleID) {
        // Pass the selected client in the info
        this.requestData.selectedServices = pricing;
        this.requestData.selectedJobTitleID = jobTitleID;
        // And go back
        this.app.shell.goBack(this.requestData);
    }.bind(this);

    this.returnRequest = function returnRequest() {
        this.app.shell.goBack(this.requestData);
    }.bind(this);
});

exports.init = A.init;

A.prototype.applyOwnNavbarRules = function() {
    this.navBar.title(this.requestData.title || '');

    if (this.requestData.cancelLink) {
        this.convertToCancelAction(this.navBar.leftAction(), this.requestData.cancelLink, this.requestData);
    }
    else {
        this.navBar.leftAction().model.updateWith(this.defaultLeftAction, true);
        this.navBar.leftAction().model.updateWith(this.newLeftAction(), true);
    }
};

A.prototype.newLeftAction = function() {
    var leftAction = {};
    var jid = this.viewModel.jobTitleID();
    var url = this.mustReturnTo || (DEFAULT_BACK_LINK  + (jid ? '/' + jid : ''));
    var handler = this.viewModel.isSelectionMode() ? this.returnRequest : null;

    leftAction.link = url;
    leftAction.text = this.leftActionText();
    leftAction.handler = handler;

    return leftAction;
};

A.prototype.leftActionText = function() {
    var clientName = this.viewModel.client() && this.viewModel.clientFullName();
    var jobTitle = this.viewModel.listingTitle();

    return this.requestData.navTitle || clientName || jobTitle || 'Back';
};

A.prototype.updateNavBarState = function updateNavBarState() {
    // Perform updates that apply this request:
    return onboarding.updateNavBar(this.navBar) || this.applyOwnNavbarRules();
};

A.prototype.referrerURL = function() {
    return (this.app.shell.referrerRoute && this.app.shell.referrerRoute.url) || '/';
};

A.prototype.serviceEditorCancelLink = function(isAdditionMode) {
    if (isAdditionMode) {
        // Sets referrer as cancel link
        return this.referrerURL();
    }
    else {
        return '/serviceProfessionalService' + this.requestData.route.path;
    }
};

A.prototype.buildRoute = function(jobTitleID, clientID, isAdditionMode) {
    var base = '/serviceProfessionalService';
    var jobTitle = '/' + jobTitleID;
    var client = clientID > 0 ? ('/client/' + clientID) : '';
    var newParam = isAdditionMode ? '/new' : '';

    return base + jobTitle + client + newParam;
};

A.prototype.parseRoute = function(url) {
    var paramsDefaults = { jobTitleID: 0, isNew: false, clientID: null };
    var matcher = new RouteMatcher([
            new Route('/:jobTitleID/new', { isNew: true }),
            new Route('/:jobTitleID/client/:clientID/new', { isNew: true }),
            new Route('/:jobTitleID/client/:clientID'),
            new Route('/new', { isNew: true }),
            new Route('/:jobTitleID')
        ], paramsDefaults);

    return matcher.match(url) || paramsDefaults;
};

A.prototype.show = function show(options) {
    Activity.prototype.show.call(this, options);

    // Remember route to go back, from a request of 'mustReturn' or last requested
    this.mustReturnTo = this.requestData.route.query.mustReturn || this.mustReturnTo;

    // Reset: avoiding errors because persisted data for different ID on loading
    // or outdated info forcing update
    this.viewModel.reset();
    this.viewModel.requestData(this.requestData);
    this.viewModel.preSelectedServices(this.requestData.selectedServices || []);

    this.viewModel.isSelectionMode(this.requestData.selectPricing === true);

    var params = this.parseRoute(options.route.path);

    var jobTitleID = params.jobTitleID | 0;
    if (jobTitleID === 0 && options.selectedJobTitleID > 0)
        jobTitleID = options.selectedJobTitleID |0;

    this.viewModel.clientID(params.clientID | 0);

    var isAdditionMode = params.isNew;

    this.viewModel.serviceEditorCancelLink(this.serviceEditorCancelLink(isAdditionMode));

    if (isAdditionMode) {
        this.requestData.cancelLink = this.referrerURL();
    }

    this.viewModel.isAdditionMode(isAdditionMode);

    this.updateNavBarState();

    this.viewModel.jobTitleID(jobTitleID);

    if (jobTitleID === 0) {
        this.viewModel.clearData();
        this.viewModel.jobTitles.sync();
    }
    else {
        // Load the data
        this.viewModel.loadServicesData();
        // Load informational listing title
        const listingDataProvider = getUserListing(jobTitleID);
        this.subscribeTo(listingDataProvider.onData, (listing) => {
            this.viewModel.listingTitle(listing.title);
            // Update navbar (may indicate the listing title)
            this.updateNavBarState();
            // May depend on current URL, will change with job title
            this.viewModel.serviceEditorCancelLink(this.serviceEditorCancelLink(this.viewModel.isAdditionMode()));
        });
        this.subscribeTo(listingDataProvider.onDataError, (error) => {
            showError({
                title: 'There was an error while loading.',
                error
            });
        });
    }
};

var UserJobProfile = require('../viewmodels/UserJobProfile');

function ViewModel(app) {
    // ViewModel has all of the properties of a ServiceProfessionalServiceViewModel
    ServiceProfessionalServiceViewModel.call(this, app);

    this.clientID = ko.observable(null);
    this.client = ko.observable(null);

    this.requestData = ko.observable(null);
    this.serviceEditorCancelLink = ko.observable(null);

    this.helpLink = '/help/relatedArticles/201967166-listing-and-pricing-your-services';
    this.isInOnboarding = onboarding.inProgress;

    this.isLocked = this.isLoading;

    this.jobTitles = new UserJobProfile(app);
    this.jobTitles.baseUrl('/serviceProfessionalService');

    this.loadServicesData = function() {
        var clientID = this.clientID();
        var jobTitleID = this.jobTitleID();
        var services = null;

        if(this.isSelectionMode()) {
            services = serviceProfessionalServices.getServicesBookableByProvider(clientID, jobTitleID);
        }
        else if (clientID) {
            services = serviceProfessionalServices.getClientSpecificServicesForJobTitle(clientID, jobTitleID);
        }
        else {
            services = serviceProfessionalServices.getList(jobTitleID);
        }

        return this.loadData(null, jobTitleID, services);
    }.bind(this);

    this.clientName = ko.pureComputed(function() {
        return (this.client() && this.client().firstName()) || '';
    }, this);

    this.serviceListGroupsFactory = function(services, pricingTypes) {
        var factories = serviceListGroupFactories;
        var listGroupsFactory = this.isSelectionMode() ? factories.providerBookedServices :
                                                         factories.providerManagedServices;
        var isClientSpecific = !!this.clientID();

        services = this.isAdditionMode() ? [] : services;

        return listGroupsFactory(services, pricingTypes, this.clientName(), isClientSpecific);
    };

    this.clientFullName = ko.pureComputed(function() {
        return (this.client() && this.client().fullName()) || '';
    }, this);

    this.clientManagerLink = ko.pureComputed(function() {
        if (this.client() || this.isSelectionMode() || onboarding.inProgress()) {
            return null;
        }
        else {
            return '#!/clients';
        }
    }, this);

    this.listingTitle = ko.observable('Job Title');

    this.submitText = ko.pureComputed(function() {
        return (
            this.isLoading() ?
                'loading...' :
                'Save and continue'
        );
    }, this);

    this.onboardingNextReady = ko.computed(function() {
        var isin = onboarding.inProgress();
        var hasPricing = this.list().length > 0;

        return isin && hasPricing;
    }, this);

    this.editServiceRequest = function() {
        return $.extend({ cancelLink: this.serviceEditorCancelLink() }, this.requestData());
    }.bind(this);

    this.newServiceRequest = function() {
        return $.extend({ cancelLink: this.serviceEditorCancelLink() }, this.requestData());
    }.bind(this);

    var baseNewServiceURL = this.newServiceURL.bind(this);

    this.newServiceURL = function(jobTitleID, pricingTypeID, isClientSpecific) {
        if(isClientSpecific) {
            return '#!serviceProfessionalServiceEditor/' + jobTitleID + '/pricingType/' + pricingTypeID + '/client/' + this.clientID() + '/new';
        }
        else {
            return baseNewServiceURL(jobTitleID, pricingTypeID);
        }
    }.bind(this);

    /**
        Ends the selection process, ready to collect selection
        and passing it to the requester activity.
        Works too to pass to the next onboarding step
    **/
    this.endSelection = function(data, event) {

        if (onboarding.inProgress()) {
            // Ensure we keep the same jobTitleID in next steps as here:
            onboarding.selectedJobTitleID(this.jobTitleID());
            onboarding.goNext();
        }
        else {
            // Run method injected by the activity to return a
            // selected address:
            this.returnSelected(
                this.selectedServices().map(function(pricing) {
                    return pricing.model.toPlainObject(true);
                }),
                this.jobTitleID()
            );
        }

        event.preventDefault();
        event.stopImmediatePropagation();
    }.bind(this);

    this.selectedServiceRequest = function(pricing) {
        return pricing.model.toPlainObject(true);
    };
}

ViewModel._inherits(ServiceProfessionalServiceViewModel);
