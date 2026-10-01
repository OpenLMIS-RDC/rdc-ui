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

describe('ProofOfDeliveryPrinter', function() {

    var ProofOfDeliveryPrinter, OpenlmisPrinterSpy;

    beforeEach(function() {
        module('proof-of-delivery', function($provide) {
            OpenlmisPrinterSpy = jasmine.createSpy('OpenlmisPrinter');

            $provide.factory('OpenlmisPrinter', function() {
                return OpenlmisPrinterSpy;
            });
        });

        inject(function($injector) {
            ProofOfDeliveryPrinter = $injector.get('ProofOfDeliveryPrinter');
        });
    });

    it('should extend OpenlmisPrinter', function() {
        new ProofOfDeliveryPrinter('some-id');

        expect(OpenlmisPrinterSpy).toHaveBeenCalledWith({
            resourceUri: '/api/proofsOfDelivery/',
            loadingMessage: 'proofOfDelivery.preparingProofOfDelivery',
            id: 'some-id'
        });
    });

    it('should have getUri method', function() {
        var printer = new ProofOfDeliveryPrinter('some-id');

        expect(typeof printer.getUri).toEqual('function');
    });

    it('should have print method', function() {
        var printer = new ProofOfDeliveryPrinter('some-id');

        expect(typeof printer.print).toEqual('function');
    });

    // RDC customization: the PoD is printed from the RDC Proof of Delivery template of the report service
    describe('getUri', function() {

        var TEMPLATE_URI = '/api/reports/templates/common/f65aa88d-c82c-4db3-bb38-d8f0051b4816/pdf',
            localStorageService, printer;

        beforeEach(inject(function(_localStorageService_) {
            localStorageService = _localStorageService_;
            printer = new ProofOfDeliveryPrinter('some-id');
            // the OpenlmisPrinter spy does not store the id
            printer.id = 'some-id';
        }));

        it('should point to the RDC Proof of Delivery template', function() {
            spyOn(localStorageService, 'get').andReturn(undefined);

            expect(printer.getUri()).toEqual(TEMPLATE_URI + '?proofOfDeliveryId=some-id');
        });

        it('should pass the current locale', function() {
            spyOn(localStorageService, 'get').andReturn('fr');

            var uri = printer.getUri();

            expect(uri).toEqual(TEMPLATE_URI + '?proofOfDeliveryId=some-id&lang=fr');
            expect(localStorageService.get).toHaveBeenCalledWith('current_locale');
        });
    });
});