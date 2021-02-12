'use strict';

module.exports = function(grunt, configuration) {
    
    var configs = { 
        local: { siteUrl: 'http://localhost/loconomics' }, 
        dev: { siteUrl: 'https://app-loconomics-dev-001.azurewebsites.net' }, 
        live: { siteUrl: 'https://app-loconomics-prod-001.azurewebsites.net' }
    };

    return configs[configuration];
};