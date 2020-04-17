'use strict';

var parseUrl = require('../../../js/utils/shell/parseUrl');


describe('utils/shell/parseUrl', function() {

    it('should be root for local url', function() {
        var base = '/loconomics/';
        var link = '/loconomics';

        var route = parseUrl(base, link);
        expect(route.root).to.be.true;
    });
    it('should be root for production url', function() {
        var base = '/';
        var link = '/';

        var route = parseUrl(base, link);
        expect(route.root).to.be.true;
    });
});