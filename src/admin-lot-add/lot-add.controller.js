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
     * @ngdoc controller
     * @name admin-lot-add.controller:LotAddController
     *
     * @description
     * Provides methods for the Add Lot modal.
     */
    angular
        .module('admin-lot-add')
        .controller('LotAddController', LotAddController);

    LotAddController.$inject = ['$state', '$stateParams', 'loadingModalService',
        'notificationService', 'stateTrackerService', 'LotResource', 'orderables'];

    function LotAddController($state, $stateParams, loadingModalService, notificationService,
                              stateTrackerService, LotResource, orderables) {
        var vm = this;

        vm.$onInit = onInit;
        vm.addLot = addLot;
        vm.goToPreviousState = stateTrackerService.goToPreviousState;

        /**
         * @ngdoc property
         * @propertyOf admin-lot-add.controller:LotAddController
         * @name lot
         * @type {Object}
         *
         * @description
         * The lot being created.
         */
        vm.lot = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-lot-add.controller:LotAddController
         * @name orderables
         * @type {Array}
         *
         * @description
         * Orderables that can have lots (i.e. that are backed by a trade item),
         * available for selection in the form.
         */
        vm.orderables = undefined;

        /**
         * @ngdoc property
         * @propertyOf admin-lot-add.controller:LotAddController
         * @name selectedOrderable
         * @type {Object}
         *
         * @description
         * The orderable selected in the form. Its trade item identifier is used as
         * the tradeItemId of the created lot.
         */
        vm.selectedOrderable = undefined;

        /**
         * @ngdoc method
         * @methodOf admin-lot-add.controller:LotAddController
         * @name $onInit
         *
         * @description
         * Initializes the controller.
         */
        function onInit() {
            vm.lot = {
                active: true
            };
            vm.orderables = orderables.filter(function(orderable) {
                return orderable.identifiers && orderable.identifiers.tradeItem;
            });
        }

        /**
         * @ngdoc method
         * @methodOf admin-lot-add.controller:LotAddController
         * @name addLot
         *
         * @description
         * Creates the lot on the server and returns to the lot list on success.
         */
        function addLot() {
            vm.lot.tradeItemId = vm.selectedOrderable.identifiers.tradeItem;

            loadingModalService.open();
            new LotResource().create(vm.lot)
                .then(function() {
                    notificationService.success('adminLotAdd.save.success');
                    loadingModalService.close();
                    $state.go('openlmis.administration.lots', $stateParams, {
                        reload: true
                    });
                })
                .catch(function() {
                    loadingModalService.close();
                    notificationService.error('adminLotAdd.save.failure');
                });
        }
    }
})();
