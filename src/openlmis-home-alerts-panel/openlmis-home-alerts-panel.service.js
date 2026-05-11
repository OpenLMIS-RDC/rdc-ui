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

    angular
        .module('openlmis-home-alerts-panel')
        .service('openlmisHomeAlertsPanelService', openlmisHomeAlertsPanelService);

    openlmisHomeAlertsPanelService.$inject = ['$resource', 'openlmisUrlFactory', 'messageService'];

    function openlmisHomeAlertsPanelService($resource, openlmisUrlFactory, messageService) {
        var STATUS_PREFIX = 'status';
        var requisitionStatusesResource = $resource(
            openlmisUrlFactory('/api'), {}, {
                get: {
                    method: 'GET',
                    url: openlmisUrlFactory('/api/requisitions/statusesStatsData')
                }
            }
        );

        var orderStatusesResource = $resource(
            openlmisUrlFactory('/api/orders/statusesStatsData'), {}, {
                get: {
                    method: 'GET',
                    url: openlmisUrlFactory('/api/orders/statusesStatsData')
                }
            }
        );

        return {
            getRequisitionsStatusesData: getRequisitionsStatusesData,
            getOrdersStatusesData: getOrdersStatusesData,
            getMappedStatusesStats: getMappedStatusesStats
        };

        function getRequisitionsStatusesData() {
            return requisitionStatusesResource.get().$promise;
        }

        function getOrdersStatusesData() {
            return orderStatusesResource.get().$promise;
        }

        function getMappedStatusesStats(tableName, statusesStats, importantData) {
            var requisitionOrder = [
                'SKIPPED', 'INITIATED', 'SUBMITTED', 'AUTHORIZED', 'IN_APPROVAL',
                'APPROVED', 'REJECTED', 'RELEASED', 'RELEASED_WITHOUT_ORDER'
            ];
            var orderOrder = [
                'CREATING', 'ORDERED', 'FULFILLING', 'READY_TO_PACK',
                'SHIPPED', 'RECEIVED', 'TRANSFER_FAILED'
            ];

            var order = tableName === 'requisition' ? requisitionOrder : orderOrder;

            var sortedStats = [];
            order.forEach(function(status) {
                if (statusesStats[status] !== undefined) {
                    sortedStats.push({
                        key: getTranslatedKey(tableName, status),
                        value: statusesStats[status],
                        isImportant: importantData.indexOf(status) !== -1
                    });
                }
            });

            return sortedStats;
        }

        function getTranslatedKey(tableName, statName) {
            var key = tableName + '.' + STATUS_PREFIX + '.' + statName;
            return messageService.get(key);
        }
    }
})();
