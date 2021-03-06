/*
 * Copyright 2016 Next Century Corporation
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
import { Injectable } from '@angular/core';

import * as _ from 'lodash';

export interface VisualizationAdapter {
    id: string;
    callback: ( any ) => void;
}

/**
 * This provides an Angular service for registering and unregistering visualizations on a page.
 *
 * @class neonDemo.services.VisualizationService
 * @constructor
 */
@Injectable()
export class VisualizationService {
    private widgets;

    constructor() {
        this.widgets = [];
    }

    /**
     * Registers a function to this service, so that it can be executed as part of a bulk operation. Should be called by visualization
     * widgets upon being created.
     * @param {String} visualizationId The unique id for the visualization.
     * @param {Function} bundleFunction The function to register.
     */
    register(visualizationId: string, bundleFunction: ( any ) => void) {
        this.widgets.push({
            id: visualizationId,
            callback: bundleFunction
        });
    };

    /**
     * Unregisters a function with the given ID from this service. Should be called by visualization widgets upon being destroyed.
     * @param {String} visualizationId The unique ID of the function being unregistered.
     */
    unregister(visualizationId) {
        let index: number = _.findIndex(this.widgets, {
            id: visualizationId
        });
        this.widgets.splice(index, 1);
    };

    /**
     * Returns a list of all objects currently registered to this service, so the functions they have references to can
     * be used for bulk operations.
     * @return {Array} The list of objects subsrcibed to this service.
     */
    getWidgets(): VisualizationAdapter[] {
        return this.widgets;
    };
}
