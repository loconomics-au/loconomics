'use strict';

module.exports = function(grunt, configuration) {
    
    var configs = { 
        local: { apiUrl: 'http://localhost/loconomics-api', sitePath: "/loconomics/" }, 
        localdev: { apiUrl: 'https://localdev.loconomics.com.au', sitePath: "/" }, 
        dev: { apiUrl: 'https://app-loconomics-dev-001.azurewebsites.net', sitePath: "/" }, 
        live: { apiUrl: 'https://app-loconomics-prod-001.azurewebsites.net', sitePath: "/" }
    };

    return configs[configuration];
};