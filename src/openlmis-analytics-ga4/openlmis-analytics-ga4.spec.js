/*
 * This program is part of the OpenLMIS logistics management information system platform software.
 * Copyright © 2017 VillageReach
 *
 * This program is free software: you can redistribute it and/or modify it under the terms
 * of the GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU Affero General Public License for more details. You should have received a copy of
 * the GNU Affero General Public License along with this program. If not, see
 * http://www.gnu.org/licenses.  For additional information contact info@OpenLMIS.org. 
 */

describe('openlmis-analytics-ga4 run', function() {
    var $window, $document;

    function cleanup() {
        var scripts = document.querySelectorAll('script[src*="googletagmanager"]');
        angular.forEach(scripts, function(script) {
            script.remove();
        });
        delete window.gtag;
        delete window.dataLayer;
    }

    afterEach(cleanup);

    describe('when tag is NOT configured', function() {

        beforeEach(module('openlmis-analytics-ga4', function($provide) {
            $provide.constant('GA4_TAG', '');
        }));

        beforeEach(inject(function(_$window_, _$document_) {
            $window = _$window_;
            $document = _$document_;
        }));

        it('should verify dependencies but do nothing', function() {
            var gaScript = $document[0].querySelector('script[src*="googletagmanager"]');

            expect(gaScript).toBeNull();
            expect($window.gtag).toBeUndefined();
        });
    });

    describe('when tag IS configured (Production)', function() {

        beforeEach(module('openlmis-analytics-ga4', function($provide) {
            $provide.constant('GA4_TAG', 'G-TEST1234');
        }));

        beforeEach(inject(function(_$window_, _$document_) {
            $window = _$window_;
            $document = _$document_;
        }));

        it('should inject the script and initialize gtag', function() {
            var gaScript = $document[0].querySelector('script[src*="googletagmanager"]');

            expect(gaScript).not.toBeNull();
            expect(gaScript.src).toContain('id=G-TEST1234');

            expect($window.gtag).toBeDefined();
            expect(angular.isFunction($window.gtag)).toBe(true);

            expect($window.dataLayer).toBeDefined();
            expect($window.dataLayer.length).toBeGreaterThan(1);
            expect($window.dataLayer[1]).toEqual(jasmine.objectContaining({
                0: 'config',
                1: 'G-TEST1234'
            }));
        });
    });
});