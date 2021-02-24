'use strict';

var commonOptions = require('./htmlmin.settings');

module.exports = function(grunt) {

    var getLandingPagesFiles = require('./shared/getLandingPagesFiles');

    return {
        webapp: {
            options: commonOptions,
            files: {
                '../web/wwwroot/app.html': '../web/wwwroot/app.html'
            }
        },
        landingPagesBuild: {
            options: commonOptions,
            files: getLandingPagesFiles(grunt, 'build/welcome', 'build/welcome')
        },
        landingPagesWeb: {
            options: commonOptions,
            files: getLandingPagesFiles(grunt, '../web/wwwroot/welcome', '../web/wwwroot/welcome')
        }
    };
};