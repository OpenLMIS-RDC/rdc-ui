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
     * @name requisition-patients-view-tab.controller:PatientsViewTabController
     *
     * @description
     * Responsible for managing patients grid.
     */
    angular
        .module('requisition-view-tab')
        .controller('PatientsViewTabController', PatientsViewTabController);

    PatientsViewTabController.$inject = ['PATIENT_TYPES', 'localStorageFactory', 'TB_STORAGE', 'LEPROSY_STORAGE',
        'canSubmit', 'canAuthorize', '$rootScope', 'requisition', 'messageService'];

    function PatientsViewTabController(PATIENT_TYPES, localStorageFactory, TB_STORAGE, LEPROSY_STORAGE, canSubmit,
                                       canAuthorize, $rootScope, requisition, messageService) {
        var vm = this;
        var leprosyTitle = 'Leprosy';
        var TBTitle = 'TB';

        vm.TBTitle = 'TB';
        vm.LeprosyTitle = 'Leprosy';
        vm.forms = {};
        vm.isFormInvalid;
        vm.isEditingPatientsTabNotDisabled = canSubmit || canAuthorize;
        vm.isInvalid = true;
        vm.getLabelForColumn = getLabelForColumn;

        vm.Columns = Array.from({
            length: 12
        }, function(x, numberInArray) {
            return {
                label: (numberInArray + 1).toString()
            };
        });

        // ODRC-108 Requisition headers should be translated
        function getLabelForColumn(column) {
            var key = 'requisition.columnLabel.' + column.name;
            var translated = messageService.get(key);
            var translatedLabel = translated === key ? column.label : translated;
            if (column.isQuantity) {
                var columnLabelSuffix = requisition.showInDoses()
                    ? messageService.get('requisitionViewTab.DosesSuffix')
                    : messageService.get('requisitionViewTab.PacksSuffix');
                translatedLabel = translatedLabel + ' ' + columnLabelSuffix;
            }
            return translatedLabel;
        }

        // Creates array with field value and disabled for every row
        function getEmptyFields(disabledIndexes) {
            return new Array(12).fill(null)
                .map(function(value, index) {
                    return {
                        value: '',
                        disabled: disabledIndexes.includes(index),
                        isInvalid: false,
                        isFocused: false
                    };
                });
        }

        function getFromLocalStorage(storageName) {
            return localStorageFactory(storageName).getAll();
        }

        // Checks which of the rows in the table are skipped
        // and creates a new table with the titles of the skipped rows.
        function handleSkippedRows(TBRows, leprosyRows) {
            var leprosySkippedRowsTitlesArray = leprosyRows.map(function(leprosyRow) {
                if (leprosyRow.isSkipped) {
                    return leprosyRow.title;
                }
            }).filter(function(leprosyRow) {
                return leprosyRow !== undefined;
            });

            var TBSkippedRowsTitlesArray = TBRows.map(function(TBRow) {
                if (TBRow.isSkipped) {
                    return TBRow.title;
                }
            }).filter(function(TBRow) {
                return TBRow !== undefined;
            });

            return leprosySkippedRowsTitlesArray.concat(TBSkippedRowsTitlesArray);
        }

        // Updates the table with a list of skipped rows in the table.
        function handleSkipRowsChange(array) {
            if (array.isSkipped === true) {
                vm.skippedRows.push(array.title);
            } else {
                vm.skippedRows = vm.skippedRows.filter(function(skippedRow) {
                    return skippedRow !== array.title;
                });
            }
        }

        function isSomeFieldInvalid() {
            var isLeprosyFieldInvalid = vm.LeprosyRowsNew.some(function(leprosyRow) {
                return leprosyRow.data.some(function(field) {
                    return field.isInvalid === true;
                });
            });

            var isTBFieldInvalid = vm.TBRowsNew.some(function(TBRow) {
                return TBRow.data.some(function(field) {
                    return field.isInvalid === true;
                });
            });

            return isLeprosyFieldInvalid || isTBFieldInvalid;
        }

        function clearFocusedState(array) {
            array.forEach(function(row) {
                row.data.forEach(function(data) {
                    if (data.isFocused === true) {
                        return data.isFocused = false;
                    }
                });
            });

            return array;
        }

        // Saves data from the table in local storage
        vm.handleSaveInLocalStorage = function(partArrayTitle, rowsValues) {
            if (partArrayTitle === leprosyTitle) {
                localStorageFactory(LEPROSY_STORAGE).clearAll();
                localStorageFactory(LEPROSY_STORAGE).put(rowsValues);
            } else if (partArrayTitle === TBTitle) {
                localStorageFactory(TB_STORAGE).clearAll();
                localStorageFactory(TB_STORAGE).put(rowsValues);
            }

            var TBArray = getFromLocalStorage(TB_STORAGE);
            var leprosyArray = getFromLocalStorage(LEPROSY_STORAGE);

            requisition.patientsData = JSON.stringify(
                {
                    TBData: TBArray,
                    leprosyData: leprosyArray
                }
            );
        };

        vm.skipRow = function(arrayTitle, index) {
            if (arrayTitle === leprosyTitle) {
                vm.LeprosyRowsNew[index].isSkipped = !!vm.LeprosyRowsNew[index].isSkipped;
                if (vm.LeprosyRowsNew[index].isSkipped) {
                    vm.LeprosyRowsNew[index].data.forEach(function(field) {
                        return field.isInvalid = false;
                    });
                }
                handleSkipRowsChange(vm.LeprosyRowsNew[index]);
                vm.handleSaveInLocalStorage(vm.LeprosyTitle, vm.LeprosyRowsNew);
            } else if (arrayTitle === TBTitle) {
                vm.TBRowsNew[index].isSkipped = !!vm.TBRowsNew[index].isSkipped;
                if (vm.TBRowsNew[index].isSkipped) {
                    vm.TBRowsNew[index].data.forEach(function(field) {
                        return field.isInvalid = false;
                    });
                }
                handleSkipRowsChange(vm.TBRowsNew[index]);
                vm.handleSaveInLocalStorage(vm.TBTitle, vm.TBRowsNew);
            }
            return vm.isFormInvalid = isSomeFieldInvalid();
        };

        vm.canSkipRow = function(arrayTitle, index) {
            if (arrayTitle === leprosyTitle) {
                var isRowNotEmpty = vm.LeprosyRowsNew[index].data.filter(function(field) {
                    if (field.value === 0) {
                        return 1;
                    }
                    return field.value;
                });
                vm.LeprosyRowsNew[index].isSkipDisabled = isRowNotEmpty.length > 0;
                vm.handleSaveInLocalStorage(vm.LeprosyTitle, vm.LeprosyRowsNew);
            } else if (arrayTitle === TBTitle) {
                isRowNotEmpty = vm.TBRowsNew[index].data.filter(function(field) {
                    if (field.value === 0) {
                        return 1;
                    }
                    return field.value;
                });
                vm.TBRowsNew[index].isSkipDisabled = isRowNotEmpty.length > 0;
                vm.handleSaveInLocalStorage(vm.TBTitle, vm.TBRowsNew);
            }
        };

        vm.validate = function(arrayTitle, rowIndex) {
            if (arrayTitle === leprosyTitle) {
                vm.LeprosyRowsNew[rowIndex].data.forEach(function(field) {
                    if (!field.disabled) {
                        if (field.value === '' || field.value === undefined || field.value === null) {
                            return (field.isInvalid = true, field.isFocused = false);
                        }
                        return field.isInvalid = false;
                    }
                });
                vm.handleSaveInLocalStorage(vm.LeprosyTitle, vm.LeprosyRowsNew);
                vm.isFormInvalid = isSomeFieldInvalid();
            } else if (arrayTitle === TBTitle) {
                vm.TBRowsNew[rowIndex].data.forEach(function(field) {
                    if (!field.disabled) {
                        if (field.value === '' || field.value === undefined || field.value === null) {
                            return (field.isInvalid = true, field.isFocused = false);
                        }
                        return field.isInvalid = false;
                    }
                });
                vm.handleSaveInLocalStorage(vm.TBTitle, vm.TBRowsNew);
                return vm.isFormInvalid = isSomeFieldInvalid();
            }
        };

        vm.onFocus = function(arrayTitle, rowIndex, dataIndex) {
            if (arrayTitle === TBTitle) {
                vm.TBRowsNew[rowIndex].data[dataIndex].isFocused = true;
            } else if (arrayTitle === leprosyTitle) {
                vm.LeprosyRowsNew[rowIndex].data[dataIndex].isFocused = true;
            }

        };

        vm.onBlur = function(arrayTitle, rowIndex, dataIndex) {
            if (arrayTitle === TBTitle) {
                vm.TBRowsNew[rowIndex].data[dataIndex].isFocused = false;
            } else if (arrayTitle === leprosyTitle) {
                vm.LeprosyRowsNew[rowIndex].data[dataIndex].isFocused = false;
            }
        };

        // Initializes the arrays - empty array if localeStorage is empty
        vm.$onInit = function() {
            var storedTBArray = getFromLocalStorage(TB_STORAGE);
            var storedLeprosyArray = getFromLocalStorage(LEPROSY_STORAGE);
            if (requisition.patientsData) {
                var patientsData = JSON.parse(requisition.patientsData);

                vm.TBRowsNew = clearFocusedState(patientsData.TBData[0]);
                vm.LeprosyRowsNew = clearFocusedState(patientsData.leprosyData[0]);
            } else {
                if (storedTBArray.length === 0) {
                    vm.TBRowsNew = [
                        {
                            key: PATIENT_TYPES.NUMBER_OF_ADULT_PATIENTS_NEW,
                            title: 'requisitionPatientsViewTab.numberOfAdultPatients.label',
                            data: getEmptyFields([6, 7, 8, 9, 10, 11]),
                            isSkipped: false,
                            isSkipDisabled: false
                        },
                        {
                            key: PATIENT_TYPES.NUMBER_OF_CHILDREN_NEW,
                            title: 'requisitionPatientsViewTab.numberOfChildren.label',
                            data: getEmptyFields([6, 7, 8, 9, 10, 11]),
                            isSkipped: false,
                            isSkipDisabled: false
                        },
                        {
                            key: PATIENT_TYPES.NUMBER_OF_RETREATMENT_PATIENTS,
                            title: 'requisitionPatientsViewTab.numberOfRetreatmentPatients.label',
                            data: getEmptyFields([6, 7, 8, 9, 10, 11]),
                            isSkipped: false,
                            isSkipDisabled: false
                        },
                        {
                            key: PATIENT_TYPES.NUMBER_OF_ADULTS_ON_IPT,
                            title: 'requisitionPatientsViewTab.numberOfAdultsOnIPT.label',
                            data: getEmptyFields([6, 7, 8, 9, 10, 11]),
                            isSkipped: false,
                            isSkipDisabled: false
                        },
                        {
                            key: PATIENT_TYPES.NUMBER_OF_CHILDREN_ON_IPT,
                            title: 'requisitionPatientsViewTab.numberOfChildrenOnIPT.label',
                            data: getEmptyFields([6, 7, 8, 9, 10, 11]),
                            isSkipped: false,
                            isSkipDisabled: false
                        }
                    ];
                } else {
                    var nestedTBArray = storedTBArray;
                    vm.TBRowsNew = clearFocusedState(nestedTBArray[0]);
                }

                if (storedLeprosyArray.length === 0) {
                    vm.LeprosyRowsNew = [
                        {
                            key: PATIENT_TYPES.NUMBER_OF_ADULT_ON_MB_REGIMEN,
                            title: 'requisitionPatientsViewTab.numberOfAdultOnMBRegimen.label',
                            data: getEmptyFields([6, 7, 8, 9, 10, 11]),
                            isSkipped: false,
                            isSkipDisabled: false
                        },
                        {
                            key: PATIENT_TYPES.NUMBER_OF_ADULT_ON_PB_REGIMEN,
                            title: 'requisitionPatientsViewTab.numberOfAdultOnPBRegimen.label',
                            data: getEmptyFields([]),
                            isSkipped: false,
                            isSkipDisabled: false
                        },
                        {
                            key: PATIENT_TYPES.NUMBER_OF_CHILDREN_ON_MB_REGIMEN,
                            title: 'requisitionPatientsViewTab.numberOfChildrenOnMBRegimen.label',
                            data: getEmptyFields([6, 7, 8, 9, 10, 11]),
                            isSkipped: false,
                            isSkipDisabled: false
                        },
                        {
                            key: PATIENT_TYPES.NUMBER_OF_CHILDREN_ON_PB_REGIMEN,
                            title: 'requisitionPatientsViewTab.numberOfChildrenOnPBRegimen.label',
                            data: getEmptyFields([]),
                            isSkipped: false,
                            isSkipDisabled: false
                        }
                    ];
                } else {
                    var nestedLeprosyArray = storedLeprosyArray;
                    vm.LeprosyRowsNew = clearFocusedState(nestedLeprosyArray[0]);
                }
            }

            vm.handleSaveInLocalStorage(vm.TBTitle, vm.TBRowsNew);
            vm.handleSaveInLocalStorage(vm.LeprosyTitle, vm.LeprosyRowsNew);
            vm.isFormInvalid = isSomeFieldInvalid();
            vm.skippedRows = handleSkippedRows(vm.TBRowsNew, vm.LeprosyRowsNew);
            vm.numberOfItemsInTheTable = vm.TBRowsNew.length + vm.LeprosyRowsNew.length;
        };

        $rootScope.$on('isSubmitInProgress', function(event, isSubmitInProgress) {
            if (isSubmitInProgress) {
                vm.LeprosyRowsNew.forEach(function(leprosyRow) {
                    if (!leprosyRow.isSkipped) {
                        leprosyRow.data.forEach(function(field) {
                            if (!field.disabled) {
                                if (field.value === '' || field.value === undefined || field.value === null) {
                                    return field.isInvalid = true;
                                }
                                return field.isInvalid = false;
                            }
                        });
                    }
                });

                vm.TBRowsNew.forEach(function(TBRow) {
                    if (!TBRow.isSkipped) {
                        TBRow.data.forEach(function(field) {
                            if (!field.disabled) {
                                if (field.value === '' || field.value === undefined || field.value === null) {
                                    return field.isInvalid = true;
                                }
                                return field.isInvalid = false;
                            }
                        });
                    }
                });

                vm.handleSaveInLocalStorage(vm.LeprosyTitle, vm.LeprosyRowsNew);
                vm.handleSaveInLocalStorage(vm.TBTitle, vm.TBRowsNew);
                return vm.isFormInvalid = isSomeFieldInvalid();
            }
        });
    }

})();
