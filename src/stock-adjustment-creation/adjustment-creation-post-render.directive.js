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

    /**
     * @ngdoc directive
     * @name stock-adjustment-creation.directive:adjustmentCreationPostRender
     *
     * @description
     * Moves the filter button into the .is-primary section after the DOM is ready.
     */
    angular
        .module('stock-adjustment-creation')
        .directive('adjustmentCreationPostRender', adjustmentCreationPostRender);

    adjustmentCreationPostRender.$inject = ['$timeout'];

    function adjustmentCreationPostRender($timeout) {
        return {
            restrict: 'A',
            link: function(scope, element) {
                $timeout(function() {
                    var filterButton = element[0].querySelector('button.filters');
                    var isPrimary = element[0].querySelector('.stock-adjustment-creation .is-primary');
                    if (filterButton && isPrimary) {
                        isPrimary.insertBefore(filterButton, isPrimary.firstChild);
                    }
                });
            }
        };
    }

})();