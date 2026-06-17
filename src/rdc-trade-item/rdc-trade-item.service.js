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
     * @name rdc-trade-item.tradeItemManufacturerService
     *
     * @description
     * Resolves the manufacturer of a trade item for a given orderable (or lot). Requests made
     * within the same digest tick are coalesced into a single GET /api/tradeItems call (using the
     * repeatable id parameter), so a table with many rows triggers one request instead of one per
     * product. Results are cached per trade item id, since trade item data is effectively static.
     */
    angular
        .module('rdc-trade-item')
        .service('tradeItemManufacturerService', service);

    service.$inject = ['TradeItemResource', '$q', '$timeout'];

    function service(TradeItemResource, $q, $timeout) {
        var resource = new TradeItemResource();
        var cache = {};
        var deferreds = {};
        var queue = [];
        var scheduledFlush = null;

        this.getManufacturer = getManufacturer;
        this.prefetch = prefetch;

        /**
         * @ngdoc method
         * @methodOf rdc-trade-item.tradeItemManufacturerService
         * @name prefetch
         *
         * @description
         * Eagerly loads the manufacturers for the given orderables. As all the lookups happen in
         * the same tick they are coalesced into a single request and cached, so subsequent
         * getManufacturer calls (e.g. from rendered rows) are served from the cache.
         *
         * @param {Array} orderables the orderables to preload manufacturers for
         */
        function prefetch(orderables) {
            (orderables || []).forEach(function(orderable) {
                getManufacturer(orderable);
            });
        }

        /**
         * @ngdoc method
         * @methodOf rdc-trade-item.tradeItemManufacturerService
         * @name getManufacturer
         *
         * @description
         * Resolves the manufacturer name for the trade item of the given lot, falling back to the
         * orderable's trade item when no lot is provided. Calls made in the same tick are batched
         * into a single request.
         *
         * @param  {Object}  orderable the orderable (uses identifiers.tradeItem when no lot given)
         * @param  {Object}  lot       the lot (uses tradeItemId; preferred when present)
         * @return {Promise}           resolves to the manufacturer name, or undefined if unknown
         */
        function getManufacturer(orderable, lot) {
            var tradeItemId = getTradeItemId(orderable, lot);
            if (!tradeItemId) {
                return $q.resolve(undefined);
            }
            if (tradeItemId in cache) {
                return $q.resolve(cache[tradeItemId]);
            }
            if (!deferreds[tradeItemId]) {
                deferreds[tradeItemId] = $q.defer();
                queue.push(tradeItemId);
                scheduleFlush();
            }
            return deferreds[tradeItemId].promise;
        }

        function scheduleFlush() {
            if (!scheduledFlush) {
                scheduledFlush = $timeout(flush, 0);
            }
        }

        function flush() {
            var ids = queue;
            queue = [];
            scheduledFlush = null;

            resource.query({
                id: ids,
                size: ids.length
            })
                .then(function(page) {
                    var manufacturerById = {};
                    var content = page && page.content ? page.content : [];
                    content.forEach(function(tradeItem) {
                        manufacturerById[tradeItem.id] = tradeItem.manufacturerOfTradeItem;
                    });
                    settle(ids, function(id) {
                        cache[id] = manufacturerById[id];
                        return manufacturerById[id];
                    });
                })
                .catch(function() {
                    // Resolve as unknown but do not cache, so a later call can retry (e.g. offline).
                    settle(ids, function() {
                        return undefined;
                    });
                });
        }

        function settle(ids, resolveValue) {
            ids.forEach(function(id) {
                deferreds[id].resolve(resolveValue(id));
                delete deferreds[id];
            });
        }

        function getTradeItemId(orderable, lot) {
            // The lot carries a mandatory trade item, so it is the authoritative source for a
            // specific lot's manufacturer (an orderable may be a commodity type whose lots span
            // several trade items). Fall back to the orderable for non-lot products.
            if (lot && lot.tradeItemId) {
                return lot.tradeItemId;
            }
            return orderable && orderable.identifiers ? orderable.identifiers.tradeItem : undefined;
        }
    }

})();
