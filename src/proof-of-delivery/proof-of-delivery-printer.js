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
     * @ngdoc service
     * @name proof-of-delivery.ProofOfDeliveryPrinter
     *
     * @description
     * Responsible for printing an instance of the Proof of Delivery with the specified ID.
     */
    angular
        .module('proof-of-delivery')
        .factory('ProofOfDeliveryPrinter', ProofOfDeliveryPrinter);

    ProofOfDeliveryPrinter.$inject = ['classExtender', 'OpenlmisPrinter', 'localStorageService',
        '$window', 'openlmisUrlFactory', 'accessTokenFactory'];

    function ProofOfDeliveryPrinter(classExtender, OpenlmisPrinter, localStorageService, $window,
                                    openlmisUrlFactory, accessTokenFactory) {

        // RDC customization: the PoD is printed from the RDC Proof of Delivery template of the report
        // service (rdc-reports), which shows the shipped quantity in packs and in doses
        var RDC_PROOF_OF_DELIVERY_TEMPLATE_ID = 'f65aa88d-c82c-4db3-bb38-d8f0051b4816';

        classExtender.extend(ProofOfDeliveryPrinter, OpenlmisPrinter);

        ProofOfDeliveryPrinter.prototype.getUri = getUri;
        ProofOfDeliveryPrinter.prototype.print = print;

        return ProofOfDeliveryPrinter;

        function getUri() {
            // RDC customization: report service template instead of /api/proofsOfDelivery/{id}/print
            var uri = '/api/reports/templates/common/' + RDC_PROOF_OF_DELIVERY_TEMPLATE_ID +
                '/pdf?proofOfDeliveryId=' + this.id;
            var locale = localStorageService.get('current_locale');
            if (locale) {
                uri += '&lang=' + locale;
            }
            return uri;
        }

        function print() {
            var url = openlmisUrlFactory(this.getUri());
            url = accessTokenFactory.addAccessToken(url);
            this.tab.location.href = url;
        }

        function ProofOfDeliveryPrinter(proofOfDeliveryId) {
            this.super({
                resourceUri: '/api/proofsOfDelivery/',
                loadingMessage: 'proofOfDelivery.preparingProofOfDelivery',
                id: proofOfDeliveryId
            });
        }

    }

})();