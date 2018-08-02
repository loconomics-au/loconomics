/**
 * Onboarding tracking information
 */
// TODO store-jsdocs
'use strict';

import shell from '../app.shell';
import userProfile from './userProfile';

var OnboardingProgress = require('../viewmodels/OnboardingProgress');
var NavAction = require('../viewmodels/NavAction');
var ko = require('knockout');
var local = require('./drivers/localforage');
var onboardingSuccessModal = require('../modals/onboardingSuccess');

const user = userProfile.data;

var NAVBAR_TITLE = 'Create your first listing';

// Onboarding management and state, initially empty so no progress
var api = new OnboardingProgress();
module.exports = api;

api.navbarTitle = function() {
    return NAVBAR_TITLE;
};

// We keep a reference to current activity name
// TODO: should be possible to replace this with shell.currentRouteObservable but need some testing
api.currentActivity = ko.observable('');
api.currentActivity(shell.currentRoute && shell.currentRoute.name);
shell.on(shell.events.itemReady, function() {
    api.currentActivity(shell.currentRoute.name);
});

/**
 * Set-up the onboarding with preset data after a signup or restoring a session.
 * @param {Object} options
 * @param {string} options.step The step where the user left the process or starts with.
 * @param {number} [options.jobTitleID] The jobTitleID selected at a previous
 * signup form or saved after the add-job-title step.
 */
api.setup = function(options) {
    var step = options.step;
    // Special: For professionals and organizations, it skips the 'welcome' step
    // (that one has the selector buttons for the type of profile and become
    // confusing for 'organization' users).
    const isProfessional = user.isServiceProfessional();
    const isOrg = user.isOrganization();
    if ((isProfessional === true || isOrg === true) && options.step === 'welcome') {
        step = api.stepAfter(step).stepName();
    }
    if (options.jobTitleID |0 > 0) {
        api.selectedJobTitleID(options.jobTitleID);
    }
    api.setStep(step);
};

// Extended with new methods

// Set the correct onboarding progress and step given a step name
// (usually from database)
api.setStep = function(stepName) {
    if (this.setStepByName(stepName)) {
        return true;
    }

    // No progress:
    this.model.reset();
    return false;
};

// Update the given navbar with the current onboarding information (only if in progress)
api.updateNavBar = function(navBar) {
    var yep = this.inProgress();
    if (yep) {
        navBar.leftAction(NavAction.menuIn);
        navBar.title(api.navbarTitle());
    }
    return yep;
};

api.goCurrentStep = function() {
    // Go current step of onboarding, and if no one, go to dashboard
    var url = this.inProgress() ? this.stepUrl() : 'dashboard';
    shell.go(url);
};

api.goNext = function goNext() {
    var url;
    var showOnboardingSuccess = false;

    if(this.isAtCurrentStep()) {
        this.incrementStep();
        userProfile.saveOnboardingStep(this.stepName());

        url = this.isFinished() ? this.stepAfterFinish() : this.stepUrl();
        // When onboarding finishes, we will prepare to display a 'success' message
        if (this.isFinished()) {
            showOnboardingSuccess = true;
        }
    }
    else {
        url = this.stepAfter(api.currentActivity()).stepUrl();
    }

    // replaceState flag is true, preventing browser back button to move between onboarding steps
    shell.go(url, null, true);

    // Display modal with notification when required
    // Exception for organizations (we just lead them to posting them to focus on that
    // as first step)
    if (showOnboardingSuccess && !user.isOrganization()) {
        onboardingSuccessModal.show({
            isServiceProfessional: user.isServiceProfessional()
        });
    }
};

api.isAtCurrentStep = ko.pureComputed(function() {
    return this.currentActivity() === this.stepName();
}, api);

/**
    Check if onboarding is enabled on the user profile
    and redirects to the current step, or do nothing.
**/
api.goIfEnabled = function() {
    var inProgress = this.inProgress();
    if (inProgress && !api.isAtCurrentStep()) {
        // Go to the step URL if we are NOT already there, by checking name to
        // not overwrite additional details, like a jobTitleID at the URL
        shell.go(api.stepUrl());
    }

    return inProgress;
};

/// Workaround for #374:
/// Local copy of the onboarding selectedJobTitleID, returned by
/// login/signup API as onboardingJobTitleID, to be able to
/// resume onboarding with the correct jobTitle, fixing #374
/// NOTE: I think is a workaround that needs a better solution through a
/// refactor just to make the code more readable and clear, but still
/// works perfect for the case.
var LOCAL_JOBTITLEID_KEY = 'onboardingJobTitleID';
/**
 * Store local copy of the ID to allow for resuming.
 * @private
 * @param {number} jobTitleID
 * @returns {Promise}
 */
var persistLocalJobTitleID = function(jobTitleID) {
    return local.setItem(LOCAL_JOBTITLEID_KEY, jobTitleID);
};
/**
 * Get the jobTitleID stored locally after a sign-up or in course onboarding,
 * needed to restore the onboarding process correctly.
 * @returns {Promise<number>} The jobTitleID
 */
api.getLocalJobTitleID = function() {
    return local.getItem(LOCAL_JOBTITLEID_KEY);
};
// At any point that selected job title ID is changed, we persist it
api.selectedJobTitleID.subscribe(persistLocalJobTitleID);
