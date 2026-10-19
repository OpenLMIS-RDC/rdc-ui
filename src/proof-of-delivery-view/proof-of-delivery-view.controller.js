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
        // RDC customization ODRC-158: shipped quantity in doses
        vm.getQuantityShipped = getQuantityShipped;
        // ODRC-155 Received date must not precede the shipment - STARTS HERE
        vm.getReceivedDateError = getReceivedDateError;
        vm.formatDate = formatDate;
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
         * user's local timezone. Undefined if the shipment carries no date.
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

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name today
         * @type {String}
         *
         * @description
         * The current day as an ISO date (YYYY-MM-DD) in the user's local timezone, as in the
         * other views. The received date cannot be later than this.
         */
        vm.today = undefined;

        /**
         * @ngdoc property
         * @propertyOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name maxReceivedDate
         * @type {Date}
         *
         * @description
         * Upper boundary passed to the datepicker - today.
         */
        vm.maxReceivedDate = undefined;

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
            vm.today = toLocalDate(new Date());
            vm.maxReceivedDate = toDatepickerBoundary(vm.today);
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

        // RDC customization ODRC-158: shipped quantity in doses
        /**
         * @ngdoc method
         * @methodOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name getQuantityShipped
         *
         * @description
         * Returns the shipped quantity of a fulfilling line item in packs, or in doses (packs times the
         * net content of the orderable). Returns undefined when the quantity, or the net content for
         * doses, is missing, so the cell stays empty.
         *
         * @param  {Object}  lineItem the fulfilling line item
         * @param  {boolean} inDoses  true for doses, false for packs
         * @return {number}           the shipped quantity, undefined if it cannot be calculated
         */
        function getQuantityShipped(lineItem, inDoses) {
            var quantityShipped = lineItem.quantityShipped;
            if (quantityShipped === undefined || quantityShipped === null) {
                return;
            }
            if (!inDoses) {
                return quantityShipped;
            }

            var netContent = lineItem.orderable ? lineItem.orderable.netContent : undefined;
            if (netContent === undefined || netContent === null) {
                return;
            }
            return quantityShipped * netContent;
        }

        // ODRC-155 Received date must not precede the shipment - STARTS HERE

        /**
         * @ngdoc method
         * @methodOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name getReceivedDateError
         *
         * @description
         * Returns a translated error message if validation fails.
         *
         * @return {String} the error message, or undefined if the received date is acceptable
         */
        function getReceivedDateError() {
            var receivedDate = vm.proofOfDelivery.receivedDate;

            if (!receivedDate) {
                return undefined;
            }

            // All sides are ISO dates in the user's local timezone, so they compare as strings.
            if (vm.shippedDate && receivedDate < vm.shippedDate) {
                return messageService.get('proofOfDeliveryView.receivedDateBeforeShippedDate', {
                    shippedDate: formatDate(vm.shippedDate)
                });
            }

            if (receivedDate > vm.today) {
                return messageService.get('proofOfDeliveryView.receivedDateInFuture');
            }

            return undefined;
        }

        /**
         * @ngdoc method
         * @methodOf proof-of-delivery-view.controller:ProofOfDeliveryViewController
         * @name formatDate
         *
         * @description
         * Formats an ISO date (YYYY-MM-DD) with the configured date format, keeping the calendar
         * day as it is.
         *
         * @param  {String} date the ISO date
         * @return {String}      the formatted date
         */
        function formatDate(date) {
            if (!date) {
                return undefined;
            }
            return $filter('date')(
                moment(date, 'YYYY-MM-DD').toDate(),
                localeService.getFromStorage().dateFormat
            );
        }

        function getShippedDate() {
            return proofOfDelivery.shipment ? proofOfDelivery.shipment.shippedDate : undefined;
        }

        /**
         * Resolves an instant into the calendar day it falls on in the user's local timezone.
         */
        function toLocalDate(date) {
            if (!date) {
                return undefined;
            }
            return moment(date).format('YYYY-MM-DD');
        }

        /**
         * Turns an ISO date into the boundary the datepicker expects. The boundary must be an
         * instant (a Date), never the ISO string itself: the datepicker parses a date-only string
         * as UTC midnight and re-projects it through the configured timezone, which moves it to the
         * previous day west of UTC. The instant is therefore placed at midday of that day in the
         * configured timezone, so the datepicker lands back on the very same calendar day.
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
