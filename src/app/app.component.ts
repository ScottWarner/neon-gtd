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
import { AfterViewInit, Component, OnInit, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';

import { DashboardOptionsComponent } from './components/dashboard-options/dashboard-options.component';
import { Dataset } from './dataset';

import { ActiveGridService } from './services/active-grid.service';
import { DatasetService } from './services/dataset.service';
import { ThemesService } from './services/themes.service';
import { NgGrid, NgGridConfig } from 'angular2-grid';
import { NeonGridItem } from './neon-grid-item';
import { AddVisualizationComponent } from './components/add-visualization/add-visualization.component';
import { FilterTrayComponent } from './components/filter-tray/filter-tray.component';

import { MdDialog, MdDialogConfig, MdDialogRef } from '@angular/material';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: [
        '../../node_modules/angular2-grid/dist/NgGrid.css',
        './app.component.scss'
    ]
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
    @ViewChild(DashboardOptionsComponent) dashboardOptionsComponent: DashboardOptionsComponent;
    @ViewChild(NgGrid) grid: NgGrid;

    // Used to determine which pane is show in the right sidenav
    private showAbout: boolean = true;
    private showAddVisualizationButton: boolean = false;
    private showFilterTrayButton: boolean = false;

    private gridItems: NeonGridItem[] = [];

    private datasets: Dataset[] = [];

    private gridConfig: NgGridConfig = {
        'resizable': true,
        'margins': [10, 0, 0, 10],
        'min_cols': 1,
        'max_cols': 24,
        'min_rows': 0,
        'max_rows': 0,
        'min_width': 50,
        'min_height': 50,
        'maintain_ratio': true,
        'auto_style': true,
        'auto_resize': true,
        'cascade': 'up',
        'fix_to_grid': true
    };

    /* A reference to the dialog for adding visualizations. */
    private addVisDialogRef: MdDialogRef<AddVisualizationComponent>;

    /* A reference to the dialog for the filter tray. */
    private filterTrayDialogRef: MdDialogRef<FilterTrayComponent>;


    constructor(private datasetService: DatasetService, private themesService: ThemesService,
        private activeGridService: ActiveGridService, public dialog: MdDialog, public viewContainerRef: ViewContainerRef) {
        // TODO: Default to false and set to true only after a dataset has been selected.
        this.showAddVisualizationButton = true;
        this.showFilterTrayButton = true;
        this.datasets = this.datasetService.getDatasets();
        this.themesService = themesService;
    }

    gridItemsToString(): string {
        return JSON.stringify(this.gridItems);
    }

    getDatasets(): Dataset[] {
        return this.datasets;
    }

    openAddVisualizationDialog() {
        let config = new MdDialogConfig();
        config.viewContainerRef = this.viewContainerRef;

        this.addVisDialogRef = this.dialog.open(AddVisualizationComponent, config);
        this.addVisDialogRef.afterClosed().subscribe(() => {
            this.addVisDialogRef = null;
        });
    }

    openFilterTrayDialog() {
        let config = new MdDialogConfig();
        config.viewContainerRef = this.viewContainerRef;

        this.filterTrayDialogRef = this.dialog.open(FilterTrayComponent, config);
        this.filterTrayDialogRef.afterClosed().subscribe(() => {
            this.filterTrayDialogRef = null;
        });
    }

    ngAfterViewInit() {
        // child is set
    }

    ngOnInit(): void {
        this.gridItems = this.activeGridService.getGridItems();
        this.activeGridService.setGrid(this.grid);
        this.activeGridService.setGridConfig(this.gridConfig);
    }

    ngOnDestroy(): void {
        console.log('neon gtd onDestroy called');
    }

    toggleDashboardOptions() {
        if (this.dashboardOptionsComponent) {
            this.dashboardOptionsComponent.loadStateNames();
        }
        this.showAbout = false;
    }
}