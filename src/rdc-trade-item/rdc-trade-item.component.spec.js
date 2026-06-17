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

describe('rdcManufacturer component', function() {

    var $compile, $rootScope, $q, tradeItemManufacturerService;

    beforeEach(function() {
        module('rdc-trade-item', function($provide) {
            tradeItemManufacturerService =
                jasmine.createSpyObj('tradeItemManufacturerService', ['getManufacturer']);
            $provide.value('tradeItemManufacturerService', tradeItemManufacturerService);
        });

        inject(function($injector) {
            $compile = $injector.get('$compile');
            $rootScope = $injector.get('$rootScope');
            $q = $injector.get('$q');
        });
    });

    function compileComponent(scope) {
        var element = $compile(
            '<rdc-manufacturer orderable="orderable" lot="lot"></rdc-manufacturer>'
        )(scope);
        scope.$apply();
        return element;
    }

    it('should render the resolved manufacturer name', function() {
        tradeItemManufacturerService.getManufacturer.andReturn($q.when('Dastech International'));

        var scope = $rootScope.$new();
        scope.orderable = {
            identifiers: {
                tradeItem: 'trade-item-1'
            }
        };
        scope.lot = undefined;

        var element = compileComponent(scope);

        expect(tradeItemManufacturerService.getManufacturer)
            .toHaveBeenCalledWith(scope.orderable, undefined);

        expect(element.text().trim()).toBe('Dastech International');
    });

    it('should render empty when the manufacturer is unknown', function() {
        tradeItemManufacturerService.getManufacturer.andReturn($q.when(undefined));

        var scope = $rootScope.$new();
        scope.orderable = {};
        scope.lot = {};

        var element = compileComponent(scope);

        expect(element.text().trim()).toBe('');
    });
});
