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

describe('LotAddController', function() {

    beforeEach(function() {
        module('admin-lot-add');

        inject(function($injector) {
            this.$controller = $injector.get('$controller');
            this.$state = $injector.get('$state');
            this.$rootScope = $injector.get('$rootScope');
            this.$q = $injector.get('$q');
            this.loadingModalService = $injector.get('loadingModalService');
            this.notificationService = $injector.get('notificationService');
            this.stateTrackerService = $injector.get('stateTrackerService');
            this.LotResource = $injector.get('LotResource');
            this.OrderableDataBuilder = $injector.get('OrderableDataBuilder');
        });

        this.stateParams = {
            page: 0,
            size: 10
        };

        this.orderableWithTradeItem = new this.OrderableDataBuilder()
            .withIdentifiers({
                tradeItem: 'trade-item-id-1'
            })
            .build();

        // an orderable without a trade item identifier cannot have lots
        this.orderableWithoutTradeItem = new this.OrderableDataBuilder()
            .withIdentifiers({})
            .build();

        this.orderables = [this.orderableWithTradeItem, this.orderableWithoutTradeItem];

        spyOn(this.loadingModalService, 'open');
        spyOn(this.loadingModalService, 'close');
        spyOn(this.notificationService, 'success');
        spyOn(this.notificationService, 'error');
        spyOn(this.$state, 'go');

        this.createDeferred = this.$q.defer();
        spyOn(this.LotResource.prototype, 'create').andReturn(this.createDeferred.promise);

        this.vm = this.$controller('LotAddController', {
            $state: this.$state,
            $stateParams: this.stateParams,
            loadingModalService: this.loadingModalService,
            notificationService: this.notificationService,
            stateTrackerService: this.stateTrackerService,
            LotResource: this.LotResource,
            orderables: this.orderables
        });

        this.vm.$onInit();
    });

    describe('$onInit', function() {

        it('should expose addLot method', function() {
            expect(typeof this.vm.addLot).toBe('function');
        });

        it('should expose goToPreviousState method', function() {
            expect(this.vm.goToPreviousState).toBe(this.stateTrackerService.goToPreviousState);
        });

        it('should initialize an active lot', function() {
            expect(this.vm.lot).toEqual({
                active: true
            });
        });

        it('should only expose orderables backed by a trade item', function() {
            expect(this.vm.orderables).toEqual([this.orderableWithTradeItem]);
        });
    });

    describe('addLot', function() {

        beforeEach(function() {
            this.vm.selectedOrderable = this.orderableWithTradeItem;
            this.vm.lot.lotCode = 'LOT-001';
        });

        it('should set the trade item id from the selected orderable', function() {
            this.vm.addLot();

            expect(this.vm.lot.tradeItemId).toEqual('trade-item-id-1');
        });

        it('should open the loading modal and create the lot', function() {
            this.vm.addLot();

            expect(this.loadingModalService.open).toHaveBeenCalled();
            expect(this.LotResource.prototype.create).toHaveBeenCalledWith(this.vm.lot);
        });

        it('should notify, close the modal and return to the list on success', function() {
            this.vm.addLot();

            this.createDeferred.resolve();
            this.$rootScope.$apply();

            expect(this.notificationService.success).toHaveBeenCalledWith('adminLotAdd.save.success');
            expect(this.loadingModalService.close).toHaveBeenCalled();
            expect(this.$state.go).toHaveBeenCalledWith(
                'openlmis.administration.lots',
                this.stateParams,
                {
                    reload: true
                }
            );
        });

        it('should notify and close the modal on failure without leaving the modal', function() {
            this.vm.addLot();

            this.createDeferred.reject();
            this.$rootScope.$apply();

            expect(this.notificationService.error).toHaveBeenCalledWith('adminLotAdd.save.failure');
            expect(this.loadingModalService.close).toHaveBeenCalled();
            expect(this.notificationService.success).not.toHaveBeenCalled();
            expect(this.$state.go).not.toHaveBeenCalled();
        });
    });
});
