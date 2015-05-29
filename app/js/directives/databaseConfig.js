'use strict';
/*
 * Copyright 2014 Next Century Corporation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
angular.module('neonDemo.directives')
.directive('databaseConfig', ['datasets', 'layouts', 'ConnectionService', 'DatasetService', function(datasets, layouts, connectionService, datasetService) {
    return {
        templateUrl: 'partials/directives/databaseConfig.html',
        restrict: 'E',
        scope: {
            storeSelect: '=',
            hostName: '=',
            gridsterConfigs: "="
        },
        link: function($scope, el) {
            el.addClass('databaseConfig');

            $scope.showDbTable = false;
            $scope.selectedDB = null;
            $scope.selectedTable = null;
            $scope.databases = [];
            $scope.dbTables = [];
            $scope.tableFields = [];
            $scope.tableFieldMappings = {};
            $scope.isConnected = false;
            $scope.clearPopover = '';
            $scope.activeServer = "Choose dataset";
            $scope.servers = datasets;

            $scope.fields = [
                {
                    label: "Latitude",
                    name: "latitude",
                    selected: ""
                },
                {
                    label: "Longitude",
                    name: "longitude",
                    selected: ""
                },
                {
                    label: "Date (and Time)",
                    name: "date",
                    selected: ""
                }
            ];

            $scope.datastoreSelect = $scope.storeSelect || 'mongo';
            $scope.hostnameInput = $scope.hostName || 'localhost';
            $scope.tableNameToFieldNames = {};
            $scope.layoutName = "";

            $scope.initialize = function() {
                $scope.messenger = new neon.eventing.Messenger();
            };

            $scope.connectToDataServer = function() {
                XDATA.userALE.log({
                    activity: "select",
                    action: "click",
                    elementId: "dataset-selector",
                    elementType: "button",
                    elementGroup: "top",
                    source: "user",
                    tags: ["dataset", $scope.datastoreSelect]
                });

                $scope.showDbTable = true;

                // Clear the active dataset while creating a custom connection so the visualizations cannot query.
                datasetService.setActiveDataset({});

                // Connect to the datastore.
                connectionService.createActiveConnection($scope.datastoreSelect, $scope.hostnameInput);

                // Clear the table names to force re-selection by the user.
                $scope.databases = [];
                $scope.dbTables = [];
                $scope.selectedDB = null;
                $scope.selectedTable = null;

                // Flag that we're connected for the front-end controls enable/disable code.
                $scope.isConnected = true;

                // Pull in the databse names.
                var connection = connectionService.getActiveConnection();
                if(connection) {
                    connection.getDatabaseNames(function(results) {
                        $scope.$apply(function() {
                            populateDatabaseDropdown(results);
                        });
                    });
                }
            };

            $scope.connectToPreset = function(server) {
                XDATA.userALE.log({
                    activity: "select",
                    action: "click",
                    elementId: "dataset-menu",
                    elementType: "button",
                    elementGroup: "top",
                    source: "user",
                    tags: ["dataset", server.name, "connect"]
                });

                // Change name of active connection.
                $scope.activeServer = server.name;

                // Set datastore connection details and connect to the datastore.
                $scope.datastoreSelect = server.datastore;
                $scope.hostnameInput = server.hostname;
                $scope.connectToDataServer();

                datasetService.setActiveDataset(server);

                $scope.selectedDB = server.database;
                $scope.selectedTable = server.tables[0].name;
                $scope.tableFields = server.tables[0].fields;
                $scope.tableFieldMappings = server.tables[0].mappings;
                $scope.updateLayout();

                // TODO:  Review this.  Callback is disabled while datasetService is being fleshed out.  This may be unnecessary.
                // $scope.selectDatabase($scope.publishDatasetChanged());
                $scope.selectDatabase();
            };

            var populateDatabaseDropdown = function(dbs) {
                $scope.databases = dbs;
            };

            $scope.selectDatabase = function(updateFieldsCallback) {
                XDATA.userALE.log({
                    activity: "select",
                    action: "click",
                    elementId: "database-selector",
                    elementType: "combobox",
                    elementGroup: "top",
                    source: "user",
                    tags: ["dataset", $scope.selectedDB, "database"]
                });

                if($scope.selectedDB) {
                    var connection = connectionService.getActiveConnection();
                    if(connection) {
                        connection.getTableNames($scope.selectedDB, function(tableNames) {
                            $scope.$apply(function() {
                                populateTableDropdown(tableNames);
                            });
                        });
                        $scope.updateFieldsForTables(updateFieldsCallback);
                    }
                } else {
                    $scope.dbTables = [];
                }
            };

            $scope.updateFieldsForTables = function(updateFieldsCallback) {
                $scope.tableNameToFieldNames = {};

                var connection = connectionService.getActiveConnection();
                if(connection) {
                    connection.getTableNamesAndFieldNames($scope.selectedDB, function(tableNamesAndFieldNames) {
                        $scope.$apply(function() {
                            var tableNames = Object.keys(tableNamesAndFieldNames);
                            for(var i = 0; i < tableNames.length; ++i) {
                                var tableName = tableNames[i];

                                // Update the fields for this table if it exists in the active dataset.
                                datasetService.updateFields(tableName, tableNamesAndFieldNames[tableName]);

                                // Store fields for each table locally because the dataset service ignores tables not included in the dataset.
                                // TODO Determine how to handle fields from tables in the database that are not included in the dataset.  This may
                                //      be solved once we update the custom connection interface to support multi-table datasets and field mappings.
                                $scope.tableNameToFieldNames[tableName] = tableNamesAndFieldNames[tableName];

                                if(tableName === $scope.selectedTable) {
                                    $scope.tableFields = datasetService.getDatabaseFields(tableName);
                                }
                            }

                            if(updateFieldsCallback) {
                                updateFieldsCallback();
                            }
                        });
                    });
                }
            };

            $scope.selectTable = function() {
                XDATA.userALE.log({
                    activity: "select",
                    action: "click",
                    elementId: "table-selector",
                    elementType: "combobox",
                    elementGroup: "top",
                    source: "user",
                    tags: ["dataset", $scope.selectedTable, "table"]
                });

                $scope.tableFields = datasetService.getDatabaseFields($scope.selectedTable);
                // If the table does not exist in the dataset configuration, use the locally stored field names for the table.
                if(!($scope.tableFields.length)) {
                    $scope.tableFields = $scope.tableNameToFieldNames[$scope.selectedTable];
                }
                $scope.tableFieldMappings = datasetService.getMappings($scope.selectedTable);
            };

            $scope.selectField = function() {
                XDATA.userALE.log({
                    activity: "select",
                    action: "click",
                    elementId: "field-selector",
                    elementType: "combobox",
                    elementGroup: "top",
                    source: "user",
                    tags: ["dataset", "field", "mapping"]
                });
            };

            $scope.openedCustom = function() {
                XDATA.userALE.log({
                    activity: "open",
                    action: "click",
                    elementId: "custom-connection",
                    elementType: "button",
                    elementGroup: "top",
                    source: "user",
                    tags: ["custom", "dataset", "dialog"]
                });
            };

            var populateTableDropdown = function(tables) {
                $scope.dbTables = tables;
            };

            $scope.publishDatasetChanged = function() {
                $scope.messenger.clearFiltersSilently(function() {
                    $scope.messenger.publish("dataset_changed", {
                        datastore: $scope.datastoreSelect,
                        hostname: $scope.hostnameInput,
                        database: $scope.selectedDB
                    });

                    XDATA.userALE.log({
                        activity: "select",
                        action: "show",
                        elementId: "dataset-selector",
                        elementType: "workspace",
                        elementGroup: "top",
                        source: "system",
                        tags: ["connect", "dataset"]
                    });
                });
            };

            $scope.updateLayout = function() {
                var layoutName = datasetService.getLayout();

                // Use the default layout (if it exists) for custom datasets or datasets without a layout.
                if(!layoutName || !layouts[layoutName]) {
                    layoutName = "default";
                }

                if(layouts[layoutName] && $scope.layoutName !== layoutName) {
                    $scope.gridsterConfigs = layouts[layoutName];
                    for(var i = 0; i < $scope.gridsterConfigs.length; ++i) {
                        $scope.gridsterConfigs[i].id = uuid();
                        if(!($scope.gridsterConfigs[i].minSizeX)) {
                            $scope.gridsterConfigs[i].minSizeX = 2;
                        }
                        if(!($scope.gridsterConfigs[i].minSizeY)) {
                            $scope.gridsterConfigs[i].minSizeY = 2;
                        }
                    }
                    // Save the layout name so we can avoid resetting the layout if we switch to a dataset that uses the same layout.
                    $scope.layoutName = layoutName;
                }
            };

            $scope.connectClick = function() {
                $scope.activeServer = "Custom";

                datasetService.setActiveDataset({
                    datastore: $scope.datastoreSelect,
                    hostname: $scope.hostnameInput,
                    database: $scope.selectedDB,
                    tables: [{
                        name: $scope.selectedTable
                    }],
                    relations: []
                });

                // Update the fields for this table in the new custom dataset.
                datasetService.updateFields($scope.selectedTable, $scope.tableFields);

                $scope.updateLayout();

                for(var key in $scope.fields) {
                    if(Object.prototype.hasOwnProperty.call($scope.fields, key)) {
                        var field = $scope.fields[key];
                        if(field.selected) {
                            datasetService.setMapping($scope.selectedTable, field.name, field.selected);
                        }
                    }
                }

                XDATA.userALE.log({
                    activity: "close",
                    action: "click",
                    elementId: "custom-connect-button",
                    elementType: "button",
                    elementGroup: "top",
                    source: "user",
                    tags: ["custom", "dataset", "connect"]
                });

                // TODO:  Review this.  Disabled while datasetService is being fleshed out.  This may be unnecessary.
                //$scope.publishDatasetChanged();
            };

            // Wait for neon to be ready, the create our messenger and intialize the view and data.
            neon.ready(function() {
                $scope.initialize();

                for(var i = 0; i < $scope.servers.length; ++i) {
                    if($scope.servers[i].connectOnLoad) {
                        $scope.connectToPreset($scope.servers[i]);
                        $scope.clearPopover = 'sr-only';
                        break;
                    }
                }
            });
        }
    };
}]);
