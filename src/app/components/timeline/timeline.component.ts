import {
    Component,
    OnInit,
    OnDestroy,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    Injector,
    //ViewChild
} from '@angular/core';
import {ConnectionService} from '../../services/connection.service';
import {DatasetService} from '../../services/dataset.service';
import {FilterService} from '../../services/filter.service';
import {ExportService} from '../../services/export.service';
import {ThemesService} from '../../services/themes.service';
import {ColorSchemeService} from '../../services/color-scheme.service';
import {FieldMetaData } from '../../dataset';
import {neonMappings} from '../../neon-namespaces';
import * as neon from 'neon-framework';
//import * as _ from 'lodash';
import {DateBucketizer} from '../bucketizers/DateBucketizer';
import {BaseNeonComponent} from '../base-neon-component/base-neon.component';
//import {ChartModule} from 'angular2-chartjs';
// import * as Chartjs from 'chart.js';
//declare var Chart: any;

@Component({
    selector: 'app-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss'],
    encapsulation: ViewEncapsulation.Emulated, changeDetection: ChangeDetectionStrategy.Default
})
export class TimelineComponent extends BaseNeonComponent implements OnInit,
    OnDestroy {
    //@ViewChild('filterChart') filterChartModule: ChartModule;
    //@ViewChild('overviewChart') overviewChartModule: ChartModule;

    private filters: {
        key: string,
        startDate: string,
        endDate: string
    }[];

    private optionsFromConfig: {
        title: string,
        database: string,
        table: string,
        dateField: string,
        granularity: string,
        unsharedFilterField: Object,
        unsharedFilterValue: string
    };

    private active: {
        dateField: FieldMetaData,
        andFilters: boolean,
        filterable: boolean,
        layers: any[],
        data: Object[],
        dateBucketizer: DateBucketizer,
        granularity: string,
    };

    private chartDefaults: {
        activeColor: string,
        inactiveColor: string
    };

    private selection: {
        mouseDown: boolean
        startX: number,
        width: number,
        x: number,
        visibleOverlay: boolean,
        startIndex: number,
        endIndex: number,
        startDate: Date,
        endDate: Date
    };

    protected filterChart: {
        data: {
            labels: any[],
            datasets: any[]
        },
        type: string,
        options: Object
    };

    protected overviewChart: {
        data: {
            labels: any[],
            datasets: any[]
        },
        type: string,
        options: Object
    };

    private colorSchemeService: ColorSchemeService;

    constructor(connectionService: ConnectionService, datasetService: DatasetService, filterService: FilterService,
        exportService: ExportService, injector: Injector, themesService: ThemesService, colorSchemeSrv: ColorSchemeService) {
        super(connectionService, datasetService, filterService, exportService, injector, themesService);
        this.optionsFromConfig = {
            title: this.injector.get('title', null),
            database: this.injector.get('database', null),
            table: this.injector.get('table', null),
            dateField: this.injector.get('dateField', null),
            granularity: this.injector.get('granularity', 'day'),
            unsharedFilterField: {},
            unsharedFilterValue: ''
        };
        this.colorSchemeService = colorSchemeSrv;
        this.filters = [];

        this.active = {
            dateField: new FieldMetaData(),
            andFilters: true,
            filterable: true,
            layers: [],
            data: [],
            dateBucketizer: null,
            granularity: 'day'
        };

        this.selection = {
            mouseDown: false,
            width: 20,
            x: 20,
            startX: 0,
            visibleOverlay: false,
            startIndex: -1,
            endIndex: -1,
            startDate: null,
            endDate: null
        };

        this.chartDefaults = {
            activeColor: 'rgba(57, 181, 74, 0.9)',
            inactiveColor: 'rgba(57, 181, 74, 0.3)'
        };

        this.onHover = this.onHover.bind(this);
        //this.overviewChart = this.getDefaultChartOptions();
        //this.filterChart = this.getDefaultChartOptions();
        //this.overviewChart.options['tooltips'].callbacks.title = tooltipTitleFunc.bind(this);
        //this.overviewChart.options['tooltips'].callbacks.label = tooltipDataFunc.bind(this);

    };

    /*getDefaultChartOptions(): any {
        let chart = {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'dataset',
                        data: []
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove', 'touchend'],
                onClick: null,
                hover: {
                    mode: 'index',
                    intersect: false,
                    onHover: this.onHover

                },
                legend: Chart.defaults.global.legend,
                tooltips: Chart.defaults.global.tooltips,
                scales: {
                    xAxes: [{
                        type: 'category',
                        position: 'bottom'
                    }]
                }
            }
        };
        chart.options['legend'].display = false;
        
                let tooltipTitleFunc = (tooltips) => {
                    let monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'
                    ];
                    let index = tooltips[0].index;
                    let date = this.active.dateBucketizer.getDateForBucket(index);
                    let month = monthNames[date.getUTCMonth()];
                    let title = date.getUTCDate() + ' ' + month + ' ' + date.getUTCFullYear();
                    return title;
                };
                let tooltipDataFunc = (tooltips) => {
                    let label = 'FIXME' + ': ' + tooltips.yLabel;
                    return label;
                };

        return chart;
    }*/

    subNgOnInit() {

    };

    subNgOnDestroy() {

    };

    getOptionFromConfig(field) {
        return this.optionsFromConfig[field];
    };

    onUpdateFields() {
        this.active.dateField = this.findFieldObject('dateField', neonMappings.TAGS);
    };

    addLocalFilter(key, startDate, endDate) {
        this.filters[0] = {
            key: key,
            startDate: startDate,
            endDate: endDate
        };
    };

    /**
    * returns -1 if cannot be found
    */
    getPointXLocationByIndex(chart, index): number {
        let dsMeta = chart.controller.getDatasetMeta(0);
        if (dsMeta.data.length > index) {
            let pointMeta = dsMeta.data[index];
            let x = pointMeta.getCenterPoint().x;
            return x;
        }
        return -1;
    }

    onHover(/*event, items*/) {
        /*if (items.length === 0) {
            return;
        }
        let isMouseUp = false;
        if (!this.selection.mouseDown && event.buttons > 0) {
            // mouse down event
            this.selection.mouseDown = true;
            this.selection.startX = items[0].getCenterPoint().x;
            this.selection.startIndex = items[0]._index;
        }

        if (this.selection.mouseDown && event.buttons === 0) {
            // mouse up event
            this.selection.mouseDown = false;
            this.selection.endIndex = items[0]._index;
            isMouseUp = true;
        }
        if (items && items.length > 0 && this.selection.mouseDown) {
            // drag event near items
            let chartArea = items[0]._chart.controller.chartArea;
            let chartBottom = chartArea.bottom;
            let chartTop = chartArea.top;
            let startIndex: number = this.selection.startIndex;
            let endIndex: number = items[0]._index;
            //let endX = items[0].getCenterPoint().x;
            //let startX = this.selection.startX
            let endX: number = -1;
            let startX: number = -1;
            if (startIndex > endIndex) {
                let temp = startIndex;
                startIndex = endIndex;
                endIndex = temp;
            }
            // at this point, start Index is <= end index
            if (startIndex === 0) {
                //first element, so don't go off the chart
                startX = this.getPointXLocationByIndex(items[0]._chart, startIndex);
            } else {
                let a = this.getPointXLocationByIndex(items[0]._chart, startIndex - 1);
                let b = this.getPointXLocationByIndex(items[0]._chart, startIndex);
                startX = (b - a) / 2 + a;
            }

            if (endIndex >= this.chart.data.labels.length - 1) {
                //last element, so don't go off the chart
                endX = this.getPointXLocationByIndex(items[0]._chart, endIndex);
            } else {
                let a = this.getPointXLocationByIndex(items[0]._chart, endIndex);
                let b = this.getPointXLocationByIndex(items[0]._chart, endIndex + 1);
                endX = (b - a) / 2 + a;
            }
            this.selection.width = Math.abs(startX - endX);
            this.selection.x = Math.min(startX, endX);
            this.selection.height = chartBottom - chartTop;
            this.selection.y = chartTop;

            //this.selection.visibleOverlay=!this.selection.visibleOverlay;
        }
        if (isMouseUp) {
            //The button was clicked, handle the selection.
            this.selection.startDate = this.active.dateBucketizer.getDateForBucket(this.selection.startIndex);
            this.selection.endDate = this.active.dateBucketizer.getDateForBucket(this.selection.endIndex);
            let key = this.active.dateField.columnName;
            this.addLocalFilter(key, this.selection.startDate, this.selection.endDate);
            this.addNeonFilter(true);
        }

        this.stopEventPropagation(event);
        //console.log(event);
        //console.log(items);*/
    }

    createNeonFilterClauseEquals(_databaseAndTableName: {}, fieldName: string) {
        let filterClauses = [];
        filterClauses[0] = neon.query.where(fieldName, '>=', this.selection.startDate);
        let endDatePlusOne = this.selection.endDate.getTime() + this.active.dateBucketizer.getMillisMultiplier();
        let endDatePlusOneDate = new Date(endDatePlusOne);
        filterClauses[1] = neon.query.where(fieldName, '<', endDatePlusOneDate);
        return neon.query.and.apply(neon.query, filterClauses);
    };

    getFilterText() {
        // I.E. TIMELINE - EARTHQUAKES: 8 AUG 2015 TO 20 DEC 2015
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let field = this.active.dateField.columnName;
        let text = database + ' - ' + table + ' - ' + field + ' = ';
        let date = this.selection.startDate;
        text += (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getUTCFullYear();
        date = this.selection.endDate;
        text += ' to ';
        text += (date.getUTCMonth() + 1) + '/' + date.getUTCDate() + '/' + date.getUTCFullYear();
        return text;
    }

    getNeonFilterFields() {

        let fields = [this.active.dateField.columnName];
        return fields;
    }

    getVisualizationName() {
        return 'Timeline';
    }

    refreshVisualization() {
        //this.filterChartModule['chart'].update();
        //this.overviewChartModule['chart'].update();
    }

    isValidQuery() {
        let valid = true;
        valid = (this.meta.database && valid);
        valid = (this.meta.table && valid);
        valid = (this.active.dateField && valid);
        return valid;
    }

    createQuery(): neon.query.Query {
        let databaseName = this.meta.database.name;
        let tableName = this.meta.table.name;
        let query = new neon.query.Query().selectFrom(databaseName, tableName);
        let whereClause = neon.query.where(this.active.dateField.columnName, '!=', null);
        let dateField = this.active.dateField.columnName;
        query = query.aggregate(neon.query['MIN'], dateField, 'date');
        let groupBys: any[] = [];
        switch (this.active.granularity) {
            //Passthrough is intentional and expected!  falls through comments tell the linter that it is ok.
            case 'hour':
                groupBys.push(new neon.query.GroupByFunctionClause('hour', dateField, 'hour'));
            /* falls through */
            case 'day':
                groupBys.push(new neon.query.GroupByFunctionClause('dayOfMonth', dateField, 'day'));
            /* falls through */
            case 'month':
                groupBys.push(new neon.query.GroupByFunctionClause('month', dateField, 'month'));
            /* falls through */
            case 'year':
                groupBys.push(new neon.query.GroupByFunctionClause('year', dateField, 'year'));
            /* falls through */
        }
        query = query.groupBy(groupBys);
        query = query.sortBy('date', neon.query['ASCENDING']);
        query = query.where(whereClause);
        return query.aggregate(neon.query['COUNT'], '*', 'value');
    };

    getColorFromScheme(index) {
        let color = this.colorSchemeService.getColorAsRgb(index);
        return color;
    }

    getFiltersToIgnore() {
        return null;
    }

    /*resetChartjs(chartModule: ChartModule, chart): void {
        let ctx = chartModule['chart'].chart.ctx;
        chartModule['chart'].destroy();
        chartModule['chart'] = new Chart(ctx, chart);
    }*/

    onQuerySuccess(response) {
        let disabled = true;
        if (disabled) {
            return;
        }
        console.log(response);
        // need to reset chart when data potentially changes type (or number of datasets)
        //this.resetChartjs(this.filterChartModule, this.filterChart);
        //this.resetChartjs(this.overviewChartModule, this.overviewChart);

        let dateToLabelFunc = null;
        let bucketizer = null;
        switch (this.active.granularity) {
            case 'hour':
                bucketizer = new DateBucketizer();
                bucketizer.setGranularity(bucketizer.HOUR);
                dateToLabelFunc = this.dateToIsoDayHour;
                break;
            case 'day':
                bucketizer = new DateBucketizer();
                bucketizer.setGranularity(bucketizer.DAY);
                dateToLabelFunc = this.dateToIsoDay;
                break;
            case 'month':
                console.error('need month bucketizer');
                return;
            case 'year':
                console.error('need year bucketizer');
                return;
        }
        dateToLabelFunc = dateToLabelFunc.bind(this);
        this.active.dateBucketizer = bucketizer;

        let startDate = response.data[0].date;
        let endDate = response.data[response.data.length - 1].date;
        bucketizer.setStartDate(new Date(startDate));
        bucketizer.setEndDate(new Date(endDate));
        let length = bucketizer.getNumBuckets();
        let myData: number[] = new Array(length).fill(0);
        for (let row of response.data) {
            let idx = bucketizer.getBucketIndex(new Date(row.date));
            myData[idx] = row.value;
        }

        let labels = new Array(length);
        for (let i = 0; i < length; i++) {
            let date = bucketizer.getDateForBucket(i);
            let dateString = dateToLabelFunc(date);
            labels[i] = dateString;
        }

        //for (let i = 0; i < dataset.data.length; i++) {
        //    dataset.backgroundColor[i] = this.chartDefaults.activeColor;
        //}

        let d = {
            label: 'datasetName',
            data: myData,
            backgroundColor: this.chartDefaults.activeColor
        };

        this.overviewChart.data = {
            labels: labels,
            datasets: [d]
        };

        this.refreshVisualization();
    };

    dateToIsoDay(date: Date): string {
        // 2017-03-09
        // TODO is there a better way to get date into ISO format so moment is happy?
        let tmp: number = date.getUTCMonth() + 1;
        let month: String = String(tmp);
        month = (tmp < 10 ? '0' + month : month);

        tmp = date.getUTCDate();
        let day: String = String(date.getUTCDate());
        day = (tmp < 10 ? '0' + day : day);
        return date.getUTCFullYear() + '-' + month + '-' + day;
    }

    dateToIsoDayHour(date: Date): string {
        // 2017-03-09T15:21:01Z
        let ret: string = this.dateToIsoDay(date);

        let tmp: number = date.getUTCHours();
        let hours: String = String(tmp);
        hours = (tmp < 10 ? '0' + hours : hours);

        tmp = date.getUTCMinutes();
        let mins: String = String(tmp);
        mins = (tmp < 10 ? '0' + mins : mins);

        tmp = date.getUTCSeconds();
        let secs: String = String(tmp);
        secs = (tmp < 10 ? '0' + secs : secs);
        ret += 'T' + hours + ':' + mins + ':' + secs + 'Z';
        return ret;
    }

    handleChangeGranularity() {
        this.logChangeAndStartQueryChain();
    }

    handleFiltersChangedEvent() {
        // Get neon filters
        // See if any neon filters are local filters and set/clear appropriately
        let database = this.meta.database.name;
        let table = this.meta.table.name;
        let fields = [this.active.dateField.columnName];
        let neonFilters = this.filterService.getFilters(database, table, fields);
        if (neonFilters && neonFilters.length > 0) {
            for (let filter of neonFilters) {
                let key = filter.filter.whereClause.lhs;
                let value = filter.filter.whereClause.rhs;
                this.addLocalFilter(key, value, key);
            }
        } else {
            this.filters = [];
        }
        this.executeQueryChain();
    };

    handleChangeDateField() {
        this.logChangeAndStartQueryChain(); // ('dateField', this.active.dateField.columnName);
    };

    handleChangeAndFilters() {
        this.logChangeAndStartQueryChain(); // ('andFilters', this.active.andFilters, 'button');
        // this.updateNeonFilter();
    };

    logChangeAndStartQueryChain() { // (option: string, value: any, type?: string) {
        // this.logChange(option, value, type);
        if (!this.initializing) {
            this.executeQueryChain();
        }
    };

    getButtonText() {
        // TODO Fix this.  It gets called a lot
        // return !this.isFilterSet() && !this.active.data.length
        //    ? 'No Data'
        //    : 'Top ' + this.active.data.length;
        // console.log('TODO - see getButtonText()')
    };

    // Get filters and format for each call in HTML
    getCloseableFilters() {
        // let closeableFilters = this.filters.map((filter) => {
        //    return filter.key + " Filter";
        //});
        //return closeableFilters;
        if (this.filters.length > 0) {
            return ['Date Filter'];
        } else {
            return [];
        }
    };

    getFilterTitle(value: string) {
        return this.active.dateField.columnName + ' = ' + value;
    };

    getFilterCloseText(value: string) {
        return value;
    };

    getRemoveFilterTooltip(value: string) {
        return 'Delete Filter ' + this.getFilterTitle(value);
    };

    removeFilter(/*value: string*/) {
        this.filters = [];
    }
}