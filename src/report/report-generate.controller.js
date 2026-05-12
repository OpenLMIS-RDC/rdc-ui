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
     * @name report.controller:ReportGenerateController
     *
     * @description
     * Controller for report options page.
     */
    angular
        .module('report')
        .controller('ReportGenerateController', controller);

    controller.$inject = [
        '$state', '$scope', '$window', 'report', 'reportFactory', '$timeout',
        'reportParamsOptions', 'reportUrlFactory', 'accessTokenFactory',  '$q', 'messageService'
    ];

    function controller($state, $scope, $window, report, reportFactory, $timeout,
                        reportParamsOptions, reportUrlFactory, accessTokenFactory, $q, messageService) {
        var vm = this;

        vm.$onInit = onInit;

        vm.downloadReport = downloadReport;

        vm.reinitializeSelect = reinitializeSelect;

        vm.getParameterLabel = getParameterLabel;

        vm.paramsInfo = {
            GeographicZone: 'report.geographicZoneInfo',
            DueDays: 'report.dueDaysInfo'
        };

        /**
         * @ngdoc property
         * @propertyOf report.controller:ReportGenerateController
         * @name messageService
         * @type {Object}
         *
         * @description
         * The object representing the message service.
         */
        vm.messageService = messageService;

        /**
         * @ngdoc property
         * @propertyOf report.controller:ReportGenerateController
         * @name booleanOptions
         * 
         * @description
         * The options for the report parameter of type boolean.
         */
        vm.booleanOptions = [{
            name: messageService.get('report.boolean.true'),
            value: 'true'
        },
        {
            name: messageService.get('report.boolean.false'),
            value: 'false'
        }];

        /**
         * @ngdoc property
         * @propertyOf report.controller:ReportGenerateController
         * @name report
         * @type {Object}
         *
         * @description
         * The object representing the selected report.
         */
        vm.report = report;

        /**
         * @ngdoc property
         * @propertyOf report.controller:ReportGenerateController
         * @name paramsOptions
         * @type {Array}
         *
         * @description
         * The param options for this report, by param. A param can have multiple options, for
         * example a period param, will have all available periods as options. Objects containing
         * 'value' and 'displayName' properties.
         */
        vm.paramsOptions = reportParamsOptions;

        /**
         * @ngdoc property
         * @propertyOf report.controller:ReportGenerateController
         * @name selectedParamsOptions
         * @type {Object}
         *
         * @description
         * The collection of selected options by param name.
         */
        vm.selectedParamsOptions = {};

        /**
         * @ngdoc property
         * @propertyOf report.controller:ReportGenerateController
         * @name selectedParamsDependencies
         * @type {Object}
         *
         * @description
         * The collection of parameter dependencies and their selected values.
         */
        vm.selectedParamsDependencies = {};

        /**
         * @ngdoc property
         * @propertyOf report.controller:ReportGenerateController
         * @name format
         * @type {String}
         *
         * @description
         * The format selected for the report. Either 'pdf' (default), 'csv', 'xls' or 'html'.
         */
        vm.format = 'pdf';

        /**
         * @ngdoc method
         * @methodOf report.controller:ReportGenerateController
         * @name downloadReport
         *
         * @description
         * Downloads the report. Opens a new tab that redirects to the actual download report
         * url, passing selected param options as well as the selected format.
         */
        function downloadReport() {
            $window.open(
                accessTokenFactory.addAccessToken(
                    reportUrlFactory.buildUrl(
                        vm.report.$module,
                        vm.report,
                        vm.selectedParamsOptions,
                        vm.format
                    )
                ),
                '_blank'
            );
        }

        /**
         * @ngdoc method
         * @methodOf report.controller:ReportGenerateController
         * @name watchDependency
         *
         * @description
         * Sets up a watch on report parameter selection,
         * to update dependent parameters options based on it's value.
         *
         * @param   {Object}    param             the report parameter that needs to watch for
         *                                        dependency.
         * @param   {Object}    dep               the dependency object to set up watch for.
         */
        function watchDependency(param, dep) {
            var watchProperty = 'vm.selectedParamsOptions.' + dep.dependency;
            $scope.$watch(watchProperty, function(newVal) {
                vm.selectedParamsDependencies[dep.dependency] = newVal;
                if (newVal) {
                    reportFactory.getReportParamOptions(param, vm.selectedParamsDependencies)
                        .then(function(items) {
                            vm.paramsOptions[param.name] = items;
                        });
                }
            });
        }

        /**
         * @ngdoc method
         * @methodOf report.controller:ReportGenerateController
         * @name $onInit
         *
         * @description
         * Initialization method of the ReportGenerateController.
         */
        function onInit() {
            angular.forEach(report.templateParameters, function(param) {
                angular.forEach(param.dependencies, function(dependency) {
                    watchDependency(param, dependency);
                });
            });
        }

        /**
         * @ngdoc method
         * @methodOf report.controller:ReportGenerateController
         * @name reinitializeSelect
         *
         * @description
         * Reinitializes the select2 plugin for the given parameter name.
         */
        function reinitializeSelect(parameterName) {
            $timeout(function() {
                var element = angular.element('#' + parameterName);

                element.select2({
                    allowClear: true,
                    selectOnClose: true,
                    placeholder: getPlaceholder(element),
                    language: {
                        noResults: function() {
                            return messageService.get('openlmisForm.selectNoResults');
                        }
                    }
                });
            });
        }

        /**
         * @ngdoc method
         * @methodOf report.controller:ReportGenerateController
         * @name getParameterLabel
         *
         * @description
         * Returns the translated label for a report parameter. It first tries to
         * find a translation for the key "reportParameter.<parameter.name>". If
         * no translation is found, it falls back to parameter.displayName.
         *
         * @param  {Object} parameter the report parameter object
         * @return {String}           the label to display
         */
        function getParameterLabel(parameter) {
            var key = 'reportParameter.' + parameter.name;
            var translated = messageService.get(key);
            return translated === key ? parameter.displayName : translated;
        }

        /**
         * @ngdoc method
         * @methodOf report.controller:ReportGenerateController
         * @name getPlaceholder
         *
         * @description
         * Gets the placeholder text from the first item in the placeholder list
         */
        function getPlaceholder(element) {
            var placeholderOption = element.children('.placeholder:first');

            if (placeholderOption.length === 0) {
                return false;
            }

            return {
                id: placeholderOption.val(),
                text: placeholderOption.text()
            };
        }
    }
})();
