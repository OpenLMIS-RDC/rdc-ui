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

describe('tradeItemManufacturerService', function() {

    var service, TradeItemResource, resourceMock, $q, $rootScope, $timeout;

    beforeEach(function() {
        module('rdc-trade-item', function($provide) {
            resourceMock = jasmine.createSpyObj('TradeItemResource', ['query']);
            TradeItemResource = function() {
                return resourceMock;
            };
            $provide.factory('TradeItemResource', function() {
                return TradeItemResource;
            });
        });

        inject(function($injector) {
            service = $injector.get('tradeItemManufacturerService');
            $q = $injector.get('$q');
            $rootScope = $injector.get('$rootScope');
            $timeout = $injector.get('$timeout');
        });
    });

    function resolveWith(tradeItems) {
        resourceMock.query.andReturn($q.when({
            content: tradeItems
        }));
    }

    function flush() {
        $timeout.flush();
        $rootScope.$apply();
    }

    it('should resolve manufacturer using the orderable trade item identifier', function() {
        resolveWith([{
            id: 'trade-item-1',
            manufacturerOfTradeItem: 'Dastech International'
        }]);

        var result;
        service.getManufacturer({
            identifiers: {
                tradeItem: 'trade-item-1'
            }
        }).then(function(manufacturer) {
            result = manufacturer;
        });
        flush();

        expect(result).toBe('Dastech International');
        expect(resourceMock.query).toHaveBeenCalledWith({
            id: ['trade-item-1'],
            size: 1
        });
    });

    it('should fall back to the lot trade item id when orderable has none', function() {
        resolveWith([{
            id: 'trade-item-2',
            manufacturerOfTradeItem: 'BOC Sciences'
        }]);

        var result;
        service.getManufacturer(undefined, {
            tradeItemId: 'trade-item-2'
        }).then(function(manufacturer) {
            result = manufacturer;
        });
        flush();

        expect(result).toBe('BOC Sciences');
        expect(resourceMock.query).toHaveBeenCalledWith({
            id: ['trade-item-2'],
            size: 1
        });
    });

    it('should prefer the lot trade item id over the orderable when both are present', function() {
        resolveWith([{
            id: 'lot-trade-item',
            manufacturerOfTradeItem: 'BOC Sciences'
        }]);

        var result;
        service.getManufacturer({
            identifiers: {
                tradeItem: 'orderable-trade-item'
            }
        }, {
            tradeItemId: 'lot-trade-item'
        }).then(function(manufacturer) {
            result = manufacturer;
        });
        flush();

        expect(result).toBe('BOC Sciences');
        expect(resourceMock.query).toHaveBeenCalledWith({
            id: ['lot-trade-item'],
            size: 1
        });
    });

    it('should fall back to the orderable trade item when the lot has no trade item id', function() {
        resolveWith([{
            id: 'orderable-trade-item',
            manufacturerOfTradeItem: 'Dastech International'
        }]);

        var result;
        service.getManufacturer({
            identifiers: {
                tradeItem: 'orderable-trade-item'
            }
        }, {
            tradeItemId: null
        }).then(function(manufacturer) {
            result = manufacturer;
        });
        flush();

        expect(result).toBe('Dastech International');
        expect(resourceMock.query).toHaveBeenCalledWith({
            id: ['orderable-trade-item'],
            size: 1
        });
    });

    it('should batch trade items requested in the same tick into a single request', function() {
        resolveWith([
            {
                id: 'trade-item-1',
                manufacturerOfTradeItem: 'Dastech International'
            },
            {
                id: 'trade-item-2',
                manufacturerOfTradeItem: 'BOC Sciences'
            }
        ]);

        var first, second;
        service.getManufacturer({
            identifiers: {
                tradeItem: 'trade-item-1'
            }
        }).then(function(manufacturer) {
            first = manufacturer;
        });
        service.getManufacturer({
            identifiers: {
                tradeItem: 'trade-item-2'
            }
        }).then(function(manufacturer) {
            second = manufacturer;
        });
        flush();

        expect(resourceMock.query.callCount).toBe(1);
        expect(resourceMock.query).toHaveBeenCalledWith({
            id: ['trade-item-1', 'trade-item-2'],
            size: 2
        });

        expect(first).toBe('Dastech International');
        expect(second).toBe('BOC Sciences');
    });

    it('should request a trade item id only once even if asked many times', function() {
        resolveWith([{
            id: 'trade-item-1',
            manufacturerOfTradeItem: 'Dastech International'
        }]);

        var orderable = {
            identifiers: {
                tradeItem: 'trade-item-1'
            }
        };
        service.getManufacturer(orderable);
        service.getManufacturer(orderable);
        flush();

        expect(resourceMock.query.callCount).toBe(1);
        expect(resourceMock.query).toHaveBeenCalledWith({
            id: ['trade-item-1'],
            size: 1
        });
    });

    it('should serve cached results without a new request on later ticks', function() {
        resolveWith([{
            id: 'trade-item-1',
            manufacturerOfTradeItem: 'Dastech International'
        }]);

        var orderable = {
            identifiers: {
                tradeItem: 'trade-item-1'
            }
        };
        service.getManufacturer(orderable);
        flush();

        var cachedResult;
        service.getManufacturer(orderable).then(function(manufacturer) {
            cachedResult = manufacturer;
        });
        $rootScope.$apply();

        expect(cachedResult).toBe('Dastech International');
        expect(resourceMock.query.callCount).toBe(1);
    });

    it('should preload manufacturers for many orderables in a single request', function() {
        resolveWith([
            {
                id: 'trade-item-1',
                manufacturerOfTradeItem: 'Dastech International'
            },
            {
                id: 'trade-item-2',
                manufacturerOfTradeItem: 'BOC Sciences'
            }
        ]);

        service.prefetch([
            {
                identifiers: {
                    tradeItem: 'trade-item-1'
                }
            },
            {
                identifiers: {
                    tradeItem: 'trade-item-2'
                }
            }
        ]);
        flush();

        expect(resourceMock.query.callCount).toBe(1);
        expect(resourceMock.query).toHaveBeenCalledWith({
            id: ['trade-item-1', 'trade-item-2'],
            size: 2
        });

        // A later row lookup is served from the cache populated by prefetch.
        var cached;
        service.getManufacturer({
            identifiers: {
                tradeItem: 'trade-item-1'
            }
        }).then(function(manufacturer) {
            cached = manufacturer;
        });
        $rootScope.$apply();

        expect(cached).toBe('Dastech International');
        expect(resourceMock.query.callCount).toBe(1);
    });

    it('should resolve to undefined without calling the resource when no trade item id is available', function() {
        var result = 'unset';
        service.getManufacturer({}, {}).then(function(manufacturer) {
            result = manufacturer;
        });
        $rootScope.$apply();

        expect(result).toBeUndefined();
        expect(resourceMock.query).not.toHaveBeenCalled();
    });

    it('should resolve to undefined and allow a retry when the request fails', function() {
        resourceMock.query.andReturn($q.reject('offline'));

        var result = 'unset';
        var orderable = {
            identifiers: {
                tradeItem: 'trade-item-1'
            }
        };
        service.getManufacturer(orderable).then(function(manufacturer) {
            result = manufacturer;
        });
        flush();

        expect(result).toBeUndefined();

        resolveWith([{
            id: 'trade-item-1',
            manufacturerOfTradeItem: 'Dastech International'
        }]);
        service.getManufacturer(orderable);
        flush();

        expect(resourceMock.query.callCount).toBe(2);
    });
});
