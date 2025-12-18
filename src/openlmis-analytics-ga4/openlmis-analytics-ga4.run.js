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

(function() {

    'use strict';

    angular
        .module('openlmis-analytics-ga4')
        .constant('GA4_TAG', '@@GOOGLE_ANALYTICS_GA4_TAG')
        .run(run);

    run.$inject = ['GA4_TAG', '$window', '$document'];

    function run(GOOGLE_ANALYTICS_GA4_TAG, $window, $document) {

        function addGAScript() {
            var isInvalid = !GOOGLE_ANALYTICS_GA4_TAG || GOOGLE_ANALYTICS_GA4_TAG === 'undefined';

            if (!isInvalid && GOOGLE_ANALYTICS_GA4_TAG.indexOf('G-') === 0) {
                var scriptTag = $document[0].createElement('script');
                scriptTag.async = true;
                scriptTag.src = 'https://www.googletagmanager.com/gtag/js?id=' + GOOGLE_ANALYTICS_GA4_TAG;
                $document[0].head.appendChild(scriptTag);

                $window.dataLayer = $window.dataLayer || [];
                $window.gtag = function() {
                    $window.dataLayer.push(arguments);
                };
                $window.gtag('js', new Date());
                $window.gtag('config', GOOGLE_ANALYTICS_GA4_TAG);
            }
        }

        addGAScript();
    }

})();
