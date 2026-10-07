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

describe('PodViewController', function() {

    var vm, $controller, ProofOfDeliveryDataBuilder, OrderDataBuilder, proofOfDelivery, order, reasons, $rootScope, $q,
        ReasonDataBuilder, VVM_STATUS, messageService, orderLineItems, ProofOfDeliveryPrinter;

    // ODRC-155 Received date must not precede the shipment - STARTS HERE
    var localeService, moment, $filter, TIME_ZONE_ID = 'Etc/Test-Plus1';
    // ODRC-155 Received date must not precede the shipment - ENDS HERE

    beforeEach(function() {
        module('proof-of-delivery-view', function($provide) {
            $provide.value('featureFlagService', {
                set: function() {},
                get: function() {}
            });
        });

        inject(function($injector) {
            $q = $injector.get('$q');
            $controller = $injector.get('$controller');
            OrderDataBuilder = $injector.get('OrderDataBuilder');
            ProofOfDeliveryDataBuilder = $injector.get('ProofOfDeliveryDataBuilder');
            ReasonDataBuilder = $injector.get('ReasonDataBuilder');
            VVM_STATUS = $injector.get('VVM_STATUS');
            messageService = $injector.get('messageService');
            $rootScope = $injector.get('$rootScope');
            ProofOfDeliveryPrinter = $injector.get('ProofOfDeliveryPrinter');
            // ODRC-155 Received date must not precede the shipment - STARTS HERE
            localeService = $injector.get('localeService');
            moment = $injector.get('moment');
            $filter = $injector.get('$filter');
            // ODRC-155 Received date must not precede the shipment - ENDS HERE
        });

        // ODRC-155 Received date must not precede the shipment - STARTS HERE
        // karma loads moment-timezone without zone data, so the test zones are defined here
        moment.tz.add('Etc/Test-Plus1|TP1|-10|0|');
        moment.tz.add('Etc/Test-Minus5|TM5|50|0|');

        TIME_ZONE_ID = 'Etc/Test-Plus1';
        spyOn(localeService, 'getFromStorage').andCallFake(function() {
            return {
                timeZoneId: TIME_ZONE_ID,
                dateFormat: 'dd/MM/yyyy'
            };
        });
        // ODRC-155 Received date must not precede the shipment - ENDS HERE

        proofOfDelivery = new ProofOfDeliveryDataBuilder().build();
        order = new OrderDataBuilder().build();
        reasons = [
            new ReasonDataBuilder().build(),
            new ReasonDataBuilder().build(),
            new ReasonDataBuilder().build()
        ];
        orderLineItems = [
            {
                groupedLineItems: [
                    proofOfDelivery.lineItems
                ]
            }
        ];

        spyOn(messageService, 'get');
        spyOn(ProofOfDeliveryPrinter.prototype, 'closeTab');
        spyOn(ProofOfDeliveryPrinter.prototype, 'openTab');
        spyOn(ProofOfDeliveryPrinter.prototype, 'print');
        spyOn(proofOfDelivery, 'save').andReturn($q.resolve(proofOfDelivery));
        spyOn(proofOfDelivery, 'isInitiated');

        vm = $controller('ProofOfDeliveryViewController', {
            proofOfDelivery: proofOfDelivery,
            order: order,
            reasons: reasons,
            orderLineItems: orderLineItems,
            canEdit: true
        });
    });

    it('it should expose Proof of Delivery', function() {
        vm.$onInit();

        expect(vm.proofOfDelivery).toBe(proofOfDelivery);
    });

    it('it should expose Order', function() {
        vm.$onInit();

        expect(vm.order).toBe(order);
    });

    it('should expose reasons', function() {
        vm.$onInit();

        expect(vm.reasons).toBe(reasons);
    });

    it('should check if VVM Status column should be shown', function() {
        vm.$onInit();

        expect(vm.showVvmColumn).toEqual(proofOfDelivery.hasProductsUseVvmStatus());
    });

    it('should expose map of fulfilling line items', function() {
        vm.$onInit();

        expect(vm.orderLineItems).toEqual(orderLineItems);
    });

    it('should expose canEdit', function() {
        vm.$onInit();

        expect(vm.canEdit).toEqual(true);

        vm = $controller('ProofOfDeliveryViewController', {
            proofOfDelivery: proofOfDelivery,
            order: order,
            reasons: reasons,
            orderLineItems: orderLineItems,
            canEdit: false
        });
        vm.$onInit();

        expect(vm.canEdit).toEqual(false);
    });

    describe('getStatusDisplay', function() {

        beforeEach(function() {
            vm.$onInit();
        });

        it('should return translated message', function() {
            messageService.get.andReturn('translated message');

            var result = vm.getStatusDisplayName(VVM_STATUS.STAGE_1);

            expect(result).toBe('translated message');
            expect(messageService.get)
                .toHaveBeenCalledWith(VVM_STATUS.$getDisplayName(VVM_STATUS.STAGE_1));
        });

    });

    describe('getReasonName', function() {

        beforeEach(function() {
            vm.$onInit();
        });

        it('should return name for reason ID', function() {
            var result = vm.getReasonName(reasons[2].id);

            expect(result).toEqual(reasons[2].name);
        });

        it('should return undefined if ID is not given', function() {
            expect(vm.getReasonName()).toBeUndefined();
        });

        it('should throw exception if reason with the given ID does not exist', function() {
            expect(function() {
                vm.getReasonName('some-other-id');
            }).toThrow();
        });

    });

    describe('printProofOfDelivery', function() {

        beforeEach(function() {
            vm.$onInit();
        });

        it('should open the window', function() {
            vm.printProofOfDelivery();

            expect(ProofOfDeliveryPrinter.prototype.openTab).toHaveBeenCalled();
        });

        it('should close the window when save proof of delivery failed', function() {
            proofOfDelivery.isInitiated.andReturn(true);
            proofOfDelivery.save.andReturn($q.reject());

            vm.printProofOfDelivery();
            $rootScope.$apply();

            expect(ProofOfDeliveryPrinter.prototype.closeTab).toHaveBeenCalled();
        });

        it('should attempt to save proof of delivery if it is initiated', function() {
            proofOfDelivery.isInitiated.andReturn(true);

            vm.printProofOfDelivery();
            $rootScope.$apply();

            expect(proofOfDelivery.save).toHaveBeenCalled();
        });

        it('should not call save if the pod is confirmed', function() {
            proofOfDelivery.isInitiated.andReturn(false);

            vm.printProofOfDelivery();
            $rootScope.$apply();

            expect(proofOfDelivery.save).not.toHaveBeenCalled();
        });

        it('should open the window if the pod is confirmed', function() {
            proofOfDelivery.isInitiated.andReturn(true);

            vm.printProofOfDelivery();

            expect(ProofOfDeliveryPrinter.prototype.print).not.toHaveBeenCalled();

            $rootScope.$apply();

            expect(ProofOfDeliveryPrinter.prototype.print).toHaveBeenCalled();
        });
    });

    // RDC customization: shipped quantity in doses
    describe('getQuantityShipped', function() {

        var lineItem;

        beforeEach(function() {
            lineItem = {
                quantityShipped: 8,
                orderable: {
                    netContent: 20
                }
            };
        });

        it('should return the shipped quantity in packs', function() {
            expect(vm.getQuantityShipped(lineItem, false)).toEqual(8);
        });

        it('should return the shipped quantity in doses', function() {
            expect(vm.getQuantityShipped(lineItem, true)).toEqual(160);
        });

        it('should return zero doses for zero packs', function() {
            lineItem.quantityShipped = 0;

            expect(vm.getQuantityShipped(lineItem, true)).toEqual(0);
        });

        it('should return undefined if the shipped quantity is missing', function() {
            lineItem.quantityShipped = null;

            expect(vm.getQuantityShipped(lineItem, false)).toBeUndefined();
            expect(vm.getQuantityShipped(lineItem, true)).toBeUndefined();
        });

        it('should return undefined in doses if the net content is missing', function() {
            lineItem.orderable.netContent = undefined;

            expect(vm.getQuantityShipped(lineItem, true)).toBeUndefined();
        });

        it('should return undefined in doses if the orderable is missing', function() {
            lineItem.orderable = undefined;

            expect(vm.getQuantityShipped(lineItem, true)).toBeUndefined();
        });
    });

    // ODRC-155 Received date must not precede the shipment - STARTS HERE

    describe('received date boundaries', function() {

        beforeEach(function() {
            proofOfDelivery.shipment.shippedDate = '2018-01-16T12:00:00.000Z';
            vm.$onInit();
        });

        it('should expose the shipped date as a local date', function() {
            expect(vm.shippedDate).toEqual('2018-01-16');
        });

        it('should resolve the shipped date in the user\'s local timezone', function() {
            proofOfDelivery.shipment.shippedDate = new Date(2018, 0, 16, 23, 30).toISOString();
            vm.$onInit();

            expect(vm.shippedDate).toEqual('2018-01-16');

            proofOfDelivery.shipment.shippedDate = new Date(2018, 0, 17, 0, 30).toISOString();
            vm.$onInit();

            expect(vm.shippedDate).toEqual('2018-01-17');
        });

        it('should leave the shipped date undefined if the shipment has none', function() {
            proofOfDelivery.shipment.shippedDate = undefined;
            vm.$onInit();

            expect(vm.shippedDate).toBeUndefined();
            expect(vm.minReceivedDate).toBeUndefined();
        });

        it('should leave the shipped date undefined if there is no shipment', function() {
            proofOfDelivery.shipment = undefined;
            vm.$onInit();

            expect(vm.shippedDate).toBeUndefined();
            expect(vm.minReceivedDate).toBeUndefined();
        });

        it('should expose today as a local date', function() {
            expect(vm.today).toEqual($filter('date')(new Date(), 'yyyy-MM-dd'));
        });

        it('should pass the datepicker boundaries as instants on the days they represent', function() {
            expect(vm.minReceivedDate instanceof Date).toBe(true);
            expect(vm.maxReceivedDate instanceof Date).toBe(true);
            expect($filter('openlmisDate')(vm.minReceivedDate)).toEqual('16/01/2018');
            expect($filter('openlmisDate')(vm.maxReceivedDate)).toEqual($filter('date')(new Date(), 'dd/MM/yyyy'));
        });

        it('should keep the datepicker boundaries on the right days west of UTC', function() {
            // a date-only boundary would be read as UTC midnight and shown as the previous day here
            TIME_ZONE_ID = 'Etc/Test-Minus5';
            vm.$onInit();

            expect(vm.minReceivedDate instanceof Date).toBe(true);
            expect(vm.maxReceivedDate instanceof Date).toBe(true);
            expect($filter('openlmisDate')(vm.minReceivedDate)).toEqual('16/01/2018');
            expect($filter('openlmisDate')(vm.maxReceivedDate)).toEqual($filter('date')(new Date(), 'dd/MM/yyyy'));
        });

    });

    describe('formatDate', function() {

        it('should format an ISO date with the configured date format', function() {
            expect(vm.formatDate('2018-01-16')).toEqual('16/01/2018');
        });

        it('should keep the calendar day west of UTC', function() {
            // openlmisDate would read the ISO date as UTC midnight and show 15/01/2018 here
            TIME_ZONE_ID = 'Etc/Test-Minus5';

            expect(vm.formatDate('2018-01-16')).toEqual('16/01/2018');
        });

        it('should return undefined for an empty date', function() {
            expect(vm.formatDate(undefined)).toBeUndefined();
        });

    });

    describe('getReceivedDateError', function() {

        beforeEach(function() {
            proofOfDelivery.shipment.shippedDate = '2018-01-16T12:00:00.000Z';
            vm.$onInit();

            messageService.get.andReturn('translated message');
        });

        it('should return no error if the received date is empty', function() {
            proofOfDelivery.receivedDate = undefined;

            expect(vm.getReceivedDateError()).toBeUndefined();
        });

        it('should return no error if the received date is the shipped date', function() {
            proofOfDelivery.receivedDate = '2018-01-16';

            expect(vm.getReceivedDateError()).toBeUndefined();
        });

        it('should return no error if the received date is after the shipped date', function() {
            proofOfDelivery.receivedDate = '2018-01-17';

            expect(vm.getReceivedDateError()).toBeUndefined();
        });

        it('should return an error if the received date is before the shipped date', function() {
            proofOfDelivery.receivedDate = '2018-01-15';

            expect(vm.getReceivedDateError()).toEqual('translated message');
            expect(messageService.get).toHaveBeenCalledWith(
                'proofOfDeliveryView.receivedDateBeforeShippedDate',
                {
                    shippedDate: '16/01/2018'
                }
            );
        });

        it('should return no error if the received date is today', function() {
            proofOfDelivery.receivedDate = vm.today;

            expect(vm.getReceivedDateError()).toBeUndefined();
        });

        it('should return an error if the received date is in the future', function() {
            proofOfDelivery.receivedDate = moment().add(1, 'days')
                .format('YYYY-MM-DD');

            expect(vm.getReceivedDateError()).toEqual('translated message');
            expect(messageService.get).toHaveBeenCalledWith('proofOfDeliveryView.receivedDateInFuture');
        });

        it('should not check against the shipped date if the shipment has none', function() {
            proofOfDelivery.shipment.shippedDate = undefined;
            vm.$onInit();

            proofOfDelivery.receivedDate = '2010-01-01';

            expect(vm.getReceivedDateError()).toBeUndefined();
        });

        it('should not check against the shipped date if there is no shipment', function() {
            proofOfDelivery.shipment = undefined;
            vm.$onInit();

            proofOfDelivery.receivedDate = '2010-01-01';

            expect(vm.getReceivedDateError()).toBeUndefined();
        });

        it('should still reject a future date if the shipment has no shipped date', function() {
            proofOfDelivery.shipment.shippedDate = undefined;
            vm.$onInit();

            proofOfDelivery.receivedDate = '2999-01-01';

            expect(vm.getReceivedDateError()).toEqual('translated message');
        });

    });

    // ODRC-155 Received date must not precede the shipment - ENDS HERE
});
