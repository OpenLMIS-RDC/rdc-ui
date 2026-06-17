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
     * @restrict E
     * @name rdc-trade-item.component:rdcManufacturer
     *
     * @description
     * Displays the manufacturer of the trade item referenced by the given orderable (or lot).
     * Resolution and caching are delegated to the tradeItemManufacturerService, so the component
     * can be dropped into any table cell without changes to the surrounding controller.
     *
     * @example
     * ```
     * <rdc-manufacturer orderable="lineItem.orderable" lot="lineItem.lot"></rdc-manufacturer>
     * ```
     */
    angular
        .module('rdc-trade-item')
        .component('rdcManufacturer', {
            bindings: {
                orderable: '<',
                lot: '<'
            },
            template: '{{$ctrl.manufacturer}}',
            controller: controller
        });

    controller.$inject = ['tradeItemManufacturerService'];

    function controller(tradeItemManufacturerService) {
        var $ctrl = this;

        $ctrl.$onChanges = onChanges;

        function onChanges() {
            tradeItemManufacturerService.getManufacturer($ctrl.orderable, $ctrl.lot)
                .then(function(manufacturer) {
                    $ctrl.manufacturer = manufacturer;
                });
        }
    }

})();
