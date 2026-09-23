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
     * @name proof-of-delivery-view.controller:ProofOfDeliveryViewController
     *
     * @description
     * Controller that drives the POD view screen.
     */
    angular
        .module('proof-of-delivery-view')
        .controller('ProofOfDeliveryViewController', ProofOfDeliveryViewController);

    ProofOfDeliveryViewController.$inject = [
        'proofOfDelivery', 'order', 'reasons', 'messageService', 'VVM_STATUS', 'orderLineItems', 'canEdit',
        'ProofOfDeliveryPrinter', '$q',
        // ODRC-155 Received date must not precede the shipment - STARTS HERE
        '$filter', 'moment', 'localeService'
        // ODRC-155 Received date must not precede the shipment - ENDS HERE
    ];

    // ODRC-155 Received date must not precede the shipment - STARTS HERE
    // $filter, moment and localeService are added to resolve the received date boundaries.
    function ProofOfDeliveryViewController(proofOfDelivery, order, reasons, messageService, VVM_STATUS, orderLineItems,
                                           canEdit, ProofOfDeliveryPrinter, $q, $filter, moment, localeService) {
        // ODRC-155 Received date must not precede the shipment - ENDS HERE

        var vm = this;

        vm.$onInit = onInit;
        vm.getStatusDisplayName = getStatusDisplayName;
        vm.getReasonName = getReasonName;
        vm.printProofOfDelivery = printProofOfDelivery;
        // ODRC-155 Received date must not precede the shipment - STARTS HERE
        vm.getReceivedDateError = getReceivedDateError;
        // ODRC-155 Received date must not precede the shipment - ENDS HERE

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name proofOfDelivery
         * @type {Object}
         *
         * @description
         * Holds Proof of Delivery.
         */
        vm.proofOfDelivery = undefined;

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name order
         * @type {Object}
         *
         * @description
         * Holds Order from Proof of Delivery.
         */
        vm.order = undefined;

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name orderLineItems
         * @type {Object}
         *
         * @description
         * Holds a map of Order Line Items with Proof of Delivery Line Items grouped by orderable.
         */
        vm.orderLineItems = undefined;

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name showVvmColumn
         * @type {boolean}
         *
         * @description
         * Indicates if VVM Status column should be shown for current Proof of Delivery.
         */
        vm.showVvmColumn = undefined;

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name canEdit
         * @type {boolean}
         *
         * @description
         * Indicates if PoD is in initiated status and if user has permission to edit it.
         */
        vm.canEdit = undefined;

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name reasons
         * @type {Array}
         *
         * @description
         * List of available stock reasons.
         */
        vm.reasons = undefined;

        // ODRC-155 Received date must not precede the shipment - STARTS HERE

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name shippedDate
         * @type {String}
         *
         * @description
         * The day the shipment left the supplying facility, as an ISO date (YYYY-MM-DD) in the
         * timezone configured for the implementation. Undefined if the shipment carries no date.
         */
        vm.shippedDate = undefined;

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name minReceivedDate
         * @type {Date}
         *
         * @description
         * Lower boundary passed to the datepicker - the shipped date.
         */
        vm.minReceivedDate = undefined;

        // ODRC-155 Received date must not precede the shipment - ENDS HERE

        /**
         * @ngdoc method
         * @methodOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name $onInit
         *
         * @description
         * Initialization method of the ProofOfDeliveryViewController.
         */
        function onInit() {
            vm.order = order;
            vm.reasons = reasons;
            vm.proofOfDelivery = proofOfDelivery;
            vm.orderLineItems = orderLineItems;
            vm.vvmStatuses = VVM_STATUS;
            vm.showVvmColumn = proofOfDelivery.hasProductsUseVvmStatus();
            vm.canEdit = canEdit;

            // ODRC-155 Received date must not precede the shipment - STARTS HERE
            vm.shippedDate = toLocalDate(getShippedDate());
            vm.minReceivedDate = toDatepickerBoundary(vm.shippedDate);
            // ODRC-155 Received date must not precede the shipment - ENDS HERE
        }

        /**
         * @ngdoc method
         * @methodOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name getStatusDisplayName
         *
         * @description
         * Returns translated status display name.
         */
        function getStatusDisplayName(status) {
            return messageService.get(VVM_STATUS.$getDisplayName(status));
        }

        /**
         * @ngdoc method
         * @methodOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name getReasonName
         *
         * @description
         * Returns a name of the reason with the given ID.
         *
         * @param  {string} id the ID of the reason
         * @return {string}    the name of the reason
         */
        function getReasonName(id) {
            if (!id) {
                return;
            }

            return vm.reasons.filter(function(reason) {
                return reason.id === id;
            })[0].name;
        }

        /**
         *
         * @ngdoc method
         * @methodOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name printProofOfDelivery
         *
         * @description
         * Prints the proof of delivery.
         */
        function printProofOfDelivery() {
            var printer = new ProofOfDeliveryPrinter();

            printer.openTab();

            (vm.proofOfDelivery.isInitiated() ? vm.proofOfDelivery.save() : $q.resolve(vm.proofOfDelivery))
                .then(function(proofOfDelivery) {
                    printer.setId(proofOfDelivery.id);
                    printer.print();
                })
                .catch(function() {
                    printer.closeTab();
                });
        }

        // ODRC-155 Received date must not precede the shipment - STARTS HERE

        /**
         * @ngdoc method
         * @methodOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name getReceivedDateError
         *
         * @description
         * Returns a translated error message if the received date entered by the user is earlier
         * than the date the shipment left the supplying facility. Returning a non-empty message
         * through the openlmis-invalid attribute marks the field - and therefore the whole form -
         * as invalid, which stops the Proof of Delivery from being confirmed.
         *
         * An empty received date is left to the 'required' validation, and a Proof of Delivery
         * whose shipment carries no shipped date is not restricted at all.
         *
         * @return {String} the error message, or undefined if the received date is acceptable
         */
        function getReceivedDateError() {
            var receivedDate = vm.proofOfDelivery.receivedDate;

            if (!receivedDate) {
                return undefined;
            }

            // Both sides are ISO dates resolved in the same timezone, so they compare as strings.
            if (vm.shippedDate && receivedDate < vm.shippedDate) {
                return messageService.get('proofOfDeliveryView.receivedDateBeforeShippedDate', {
                    shippedDate: $filter('openlmisDate')(getShippedDate())
                });
            }

            return undefined;
        }

        function getShippedDate() {
            return proofOfDelivery.shipment ? proofOfDelivery.shipment.shippedDate : undefined;
        }

        /**
         * Resolves an instant into the calendar day it falls on in the timezone configured for the
         * implementation - the same timezone the openlmisDate filter renders with, so what the user
         * compares on screen is what the validation compares.
         */
        function toLocalDate(date) {
            if (!date) {
                return undefined;
            }
            return moment.tz(date, getTimeZoneId())
                .format('YYYY-MM-DD');
        }

        /**
         * Turns an ISO date into the boundary object the datepicker expects. The datepicker
         * re-projects whatever it is given through the configured timezone, so the boundary is
         * anchored at midday to guarantee it lands back on the very same calendar day.
         */
        function toDatepickerBoundary(localDate) {
            if (!localDate) {
                return undefined;
            }
            return moment.tz(localDate + ' 12:00', 'YYYY-MM-DD HH:mm', getTimeZoneId())
                .toDate();
        }

        function getTimeZoneId() {
            return localeService.getFromStorage().timeZoneId;
        }

        // ODRC-155 Received date must not precede the shipment - ENDS HERE
    }
}());
