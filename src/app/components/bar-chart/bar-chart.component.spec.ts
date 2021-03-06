/* tslint:disable:no-unused-variable */
import {  ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Injector } from '@angular/core';

import { ChartModule } from 'angular2-chartjs';

import {} from 'jasmine';

import { BarChartComponent } from './bar-chart.component';
import { ExportControlComponent } from '../export-control/export-control.component';
import { ExportService } from '../../services/export.service';
import { ConnectionService } from '../../services/connection.service';
import { DatasetService } from '../../services/dataset.service';
import { TranslationService } from '../../services/translation.service';
import { FilterService } from '../../services/filter.service';
import { ThemesService } from '../../services/themes.service';
import { ErrorNotificationService } from '../../services/error-notification.service';
import { NeonGTDConfig } from '../../neon-gtd-config';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {AppMaterialModule} from '../../app.material.module';

describe('Component: BarChart', () => {
    let testConfig: NeonGTDConfig = new NeonGTDConfig();
    let component: BarChartComponent;
    let fixture: ComponentFixture<BarChartComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                BarChartComponent,
                ExportControlComponent,
            ],
            providers: [
                ConnectionService,
                DatasetService,
                FilterService,
                ExportService,
                TranslationService,
                ErrorNotificationService,
                ThemesService,
                Injector,
                { provide: 'config', useValue: testConfig }
            ],
            imports: [
                BrowserAnimationsModule,
                AppMaterialModule,
                FormsModule,
                ChartModule
            ]
        });
        fixture = TestBed.createComponent(BarChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', (() => {
        expect(component).toBeTruthy();
    }));
});
