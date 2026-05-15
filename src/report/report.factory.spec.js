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

describe('reportFactory', function() {

    var reportServiceMock;

    beforeEach(function() {
        module('report', function($provide) {
            reportServiceMock = jasmine.createSpyObj('reportService',
                ['getReport', 'getReports', 'getReportParamsOptions']);

            $provide.service('reportService', function() {
                return reportServiceMock;
            });

            $provide.constant('REPORTING_SERVICES', ['requisitions']);
        });

        inject(function($injector) {
            this.$rootScope = $injector.get('$rootScope');
            this.reportFactory = $injector.get('reportFactory');
            this.REPORT_RIGHTS = $injector.get('REPORT_RIGHTS');
            this.$q = $injector.get('$q');
            this.authorizationService = $injector.get('authorizationService');
        });

        this.paramPeriod = {
            name: 'periods',
            selectExpression: '/api/periods',
            selectProperty: 'name',
            dependencies: []
        };
        this.paramFacility = {
            name: 'facilities',
            selectExpression: '/api/facilities',
            selectProperty: 'code',
            displayProperty: 'name',
            dependencies: []
        };
        this.paramStatus = {
            name: 'status',
            options: ['alive', 'dead'],
            dependencies: []
        };
        this.periodOptions = [
            {
                name: 'Q1'
            },
            {
                name: 'Q2'
            },
            {
                name: 'Q3'
            }
        ];
        this.facilityOptions = [
            {
                code: 'F01',
                name: 'Facility 1'
            },
            {
                code: 'F02',
                name: 'Facility 2'
            }
        ];

        this.REPORT_ID = '629bc86c-0291-11e7-86e3-3417eb83144e';
        this.REPORT_ID2 = '6b207f14-0291-11e7-b732-3417eb83144e';
        this.REQUISITIONS = 'requisitions';
        this.PERIODS_URL = '/api/periods';
        this.FACILITIES_URL = '/api/facilities';

        this.report = {
            id: this.REPORT_ID,
            templateParameters: [this.paramPeriod, this.paramFacility]
        };
        this.report2 = {
            id: this.REPORT_ID2,
            templateParameters: [this.paramStatus]
        };

        var context = this;

        reportServiceMock.getReport.andCallFake(function(module, id) {
            if (module === context.REQUISITIONS) {
                if (id === context.REPORT_ID) {
                    return context.$q.when(context.report);
                }
                if (id === context.REPORT_ID2) {
                    return context.$q.when(context.report2);
                }
            }
        });

        reportServiceMock.getReports.andCallFake(function(module) {
            if (module === context.REQUISITIONS) {
                return context.$q.when([context.report, context.report2]);
            }
        });

        reportServiceMock.getReportParamsOptions.andCallFake(function(uri) {
            if (uri === context.FACILITIES_URL) {
                return context.$q.when({
                    data: context.facilityOptions
                });
            }
            if (uri === context.PERIODS_URL) {
                return context.$q.when({
                    data: context.periodOptions
                });
            }
        });
    });

    it('should get a single report', function() {
        var report;

        this.reportFactory.getReport(this.REQUISITIONS, this.REPORT_ID).then(function(data) {
            report = data;
        });
        this.$rootScope.$apply();

        expect(report).not.toBe(undefined);
        expect(report.id).toEqual(this.REPORT_ID);
    });

    it('should get reports for a module', function() {
        var reports;

        this.reportFactory.getReports(this.REQUISITIONS).then(function(data) {
            reports = data;
        });
        this.$rootScope.$apply();

        expect(reports).toEqual([this.report, this.report2]);
    });

    it('should get all reports', function() {
        spyOn(this.authorizationService, 'hasRight').andReturn(true);

        var reports;

        this.reportFactory.getAllReports().then(function(data) {
            reports = data;
        });
        this.$rootScope.$apply();

        expect(reports).toEqual([this.report, this.report2]);
        expect(reportServiceMock.getReports).toHaveBeenCalledWith(this.REQUISITIONS);
    });

    it('should not get reports when user does not have REPORTS_VIEW right', function() {
        spyOn(this.authorizationService, 'hasRight').andReturn(false);

        var reports;

        this.reportFactory.getAllReports().then(function(data) {
            reports = data;
        });
        this.$rootScope.$apply();

        expect(reports).toEqual([]);
        expect(reportServiceMock.getReports).not.toHaveBeenCalled();
    });

    it('should retrieve report param options', function() {
        var expectedResult = {
                periods: [
                    {
                        name: 'Q1',
                        value: 'Q1',
                        $raw:
                        {
                            name: 'Q1'
                        }
                    },
                    {
                        name: 'Q2',
                        value: 'Q2',
                        $raw:
                        {
                            name: 'Q2'
                        }
                    },
                    {
                        name: 'Q3',
                        value: 'Q3',
                        $raw:
                        {
                            name: 'Q3'
                        }
                    }
                ],
                facilities: [
                    {
                        name: 'Facility 1',
                        value: 'F01',
                        $raw:
                        {
                            code: 'F01',
                            name: 'Facility 1'
                        }
                    },
                    {
                        name: 'Facility 2',
                        value: 'F02',
                        $raw:
                        {
                            code: 'F02',
                            name: 'Facility 2'
                        }
                    }
                ]
            },
            paramOptions;

        this.reportFactory.getReportParamsOptions(this.report).then(function(data) {
            paramOptions = data;
        });
        this.$rootScope.$apply();

        expect(paramOptions).toEqual(expectedResult);
    });

    it('should populate report param options with predefined list', function() {
        var expectedResult = {
                status: [
                    {
                        name: 'alive',
                        value: 'alive'
                    },
                    {
                        name: 'dead',
                        value: 'dead'
                    }
                ]
            },
            paramOptions;

        this.reportFactory.getReportParamsOptions(this.report2).then(function(data) {
            paramOptions = data;
        });
        this.$rootScope.$apply();

        expect(paramOptions).toEqual(expectedResult);
    });

    it('should retrieve options for report param with dependencies', function() {
        this.paramFacility.dependencies.push({
            dependency: 'periods',
            placeholder: 'period'
        });

        var expectedResult = {
                periods: [
                    {
                        name: 'Q1',
                        value: 'Q1',
                        $raw:
                        {
                            name: 'Q1'
                        }
                    },
                    {
                        name: 'Q2',
                        value: 'Q2',
                        $raw:
                        {
                            name: 'Q2'
                        }
                    },
                    {
                        name: 'Q3',
                        value: 'Q3',
                        $raw:
                        {
                            name: 'Q3'
                        }
                    }
                ],
                facilities: [
                    {
                        name: 'Facility 1',
                        value: 'F01',
                        $raw:
                        {
                            code: 'F01',
                            name: 'Facility 1'
                        }
                    },
                    {
                        name: 'Facility 2',
                        value: 'F02',
                        $raw:
                        {
                            code: 'F02',
                            name: 'Facility 2'
                        }
                    }
                ]
            },
            paramOptions;

        this.reportFactory.getReportParamsOptions(this.report).then(function(data) {
            paramOptions = data;
        });
        this.$rootScope.$apply();

        expect(paramOptions).toEqual(expectedResult);
    });
});
