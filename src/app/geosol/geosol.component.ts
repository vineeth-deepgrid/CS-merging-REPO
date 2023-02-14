import { Component, OnInit, HostListener, AfterViewInit, EventEmitter, Input, Output, SimpleChange, OnChanges, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { Draggable } from '../../assets/js/Draggable.js';
import { TweenLite } from '../../assets/js/TweenLite.js';
import { BasemapService } from '../basemap/basemap.service';
import { NgbModalConfig, NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import {
  trigger,
  state,
  style,
  animate,
  transition,
  group
  // ...
} from '@angular/animations';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { AuthObservableService } from '../Services/authObservableService';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { BasemapFactory } from '../basemap/BasemapFactory.js';
import { get } from 'ol/proj';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4.js';
import OlView from 'ol/View';
import Stamen from 'ol/source/Stamen.js';
import OlTileLayer from 'ol/layer/Tile';
import OlXYZ from 'ol/source/XYZ';
import { CommonService } from '../Services/common.service';
import { GeotowerService } from '../geotower/geotower.service';
import { environment } from 'src/environments/environment';
// import { jsPDF } from 'jspdf';
import * as jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getPointResolution } from 'ol/proj';
import {fromExtent} from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import {OSM, Vector as VectorSource} from 'ol/source';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import { Observable } from 'rxjs';
import { PrintToolService } from '../Services/print-tool.service.js';
// import {getCoordinateFromPixel} from 'ol/map';
import Map from 'ol/Map';
// import OSM from 'ol/source/OSM';
// import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import OlMap from 'ol/Map';
import { ChangeProjectonService } from '../Services/change-projecton.service.js';
import { variable } from '@angular/compiler/src/output/output_ast.js';


@Component({
  selector: 'app-geosol',
  templateUrl: './geosol.component.html',
  styleUrls: ['./geosol.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('in', style({ width: '*', opacity: 0 })),
      transition(':enter', [
        style({ width: '0', opacity: 0 }),

        group([
          animate(300, style({ width: '*' })),
          animate('400ms ease-in-out', style({ opacity: '1' }))
        ])

      ])
    ]),
    trigger('slideInOut-mid', [
      state('in', style({ width: '*', opacity: 0 })),
      transition(':enter', [
        style({ width: '0', opacity: 0 }),

        group([
          animate(300, style({ width: '*' })),
          animate('400ms ease-in-out', style({ opacity: '1' }))
        ])

      ])
    ])
  ],
  providers: [NgbModalConfig, NgbModal]
})
export class GeosolComponent implements OnInit, AfterViewInit, OnChanges {

  showCompassCtrl = '';
  closeCompassCtrl = '';
  topRightMenuToogle = false;
  closeResult: string;
  unitValue = '';
  unitsList: any = [
    {
      value: 'us',
      view: 'Miles',
      scaleValue: 'us'
    },
    {
      value: 'metric',
      view: 'Kms',
      scaleValue: 'metric'
    }/* ,
    {
      value: 'METERS',
      view: 'Meters',
    } */
  ];
  // unitCtrl:FormControl = new FormControl('');
  form: FormGroup;

  isLeftWingExpanded = true;
  isRightWingExpanded = true;
  mapProjectionUnits = '500 nm';
  mapProjectionUnitsPopup = '';
  innerWidth: number;
  orientationActive = false;
  iconWidth = 60; // 65;

  leftWingContainerWidth: string = ((this.iconWidth * 5) + 45) + 'px'; // '320px';
  rightWingContainerWidth: string = ((this.iconWidth * 5) + 45) + 'px'; // '320px';

  tcAndPrivacyActivePage = 'tc';
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  scaleLineWidth = 0;
  rotationAngle: FormControl = new FormControl(0);
  compassOpenState = false;
  selectedOption = '';
  frameworkForm: FormGroup;

  referenceSystemTypes: any[] = [
    {name: 'EPSG:4326', value: '4326'},
    {name: 'EPSG:3857', value: '3857'},
    { name: 'EPSG:2100', value: '2100'},
    { name: 'EPSG:27700', value: '27700'},
    { name: 'EPSG:23032', value: '23032'},
    { name: 'EPSG:5479', value: '5479'},
    { name: 'EPSG:21781', value: '21781'},
    { name: 'EPSG:3413', value: '3413'},
    { name: 'EPSG:2163', value: '2163'},
    { name: 'ESRI:54009', value: '54009'},
    { name: 'EPSG:2229', value: '2229'},
  ];
  selectedReferenceSystem: any = this.referenceSystemTypes[0];
  @Input() awarenessCurrentMode: any = {};
  @Input() globalObject: any = {};
  @Output() toggleAwareness: EventEmitter<any> = new EventEmitter<any>();
  @Output() passInputValue: EventEmitter<any> = new EventEmitter<any>();
  lastClickHappend: number = new Date().getTime();
  @Input() isGuest = true;
  // showConceptSplashScreen = false;
  // showGeoReferencingScreen: boolean;
  // minimizedGeoRefWindow: boolean;
  @ViewChild('geoRefWindow') geoRefWindow: ElementRef<HTMLDivElement>;
  showTooltip = true;
  @Output() triggerToShowFeSpalsh: EventEmitter<any> = new EventEmitter<any>();
  
  activeSitesForPresentation: any[] = [];

  showFrameworkForm: boolean = false;
  epsgCodee: string;

  constructor(private basemapService: BasemapService, config: NgbModalConfig, private modalService: NgbModal,
              private geotowerService: GeotowerService, private renderer: Renderer2,
              private commonService: CommonService, private formBuilder: FormBuilder, 
              private observ: AuthObservableService, private printToolService: PrintToolService,
              private authObsr: AuthObservableService,private changeService:ChangeProjectonService) {
    config.backdrop = 'static';
    config.keyboard = false;
    this.opts = {
      position: 'right',
      barBackground: '#656565', // '#C9C9C9',
      barOpacity: '0.7',
      barWidth: '7', // '10',
      barBorderRadius: '5', // '20',
      barMargin: '0',
      gridBackground: '#D9D9D9',
      gridOpacity: '1',
      gridWidth: '2',
      gridBorderRadius: '20',
      gridMargin: '0',
      alwaysVisible: true,
      visibleTimeout: 1000,
      // scrollSensitivity: 1
    };
    
    this.form = this.formBuilder.group({
      unitCtrl: ['us']
    });
    this.frameworkForm = this.formBuilder.group({
      framework: new FormControl('angular')
    });
    this.frameworkForm.controls.framework.valueChanges.subscribe(res => {
      console.log(res);
    });
    localStorage.setItem('unit', 'us');
    this.rotationAngle.valueChanges.subscribe(val => {
      console.log('ANGLE CHANGED');
      console.log(val);
      let rotationValue;
      if (this.commonService.isValid(val) && val !== '-' && val !== '+') {
        rotationValue = val;
        console.log(Math.PI / 180 * rotationValue);
        this.basemapService.getCurrentBasemap().getView().setRotation(Math.PI / 180 * rotationValue);
      } else {
        rotationValue = 0;
        this.basemapService.getCurrentBasemap().getView().setRotation(Math.PI / 180 * 0);
      }
    });
    this.observ.subscribeForAuthStatus('GeosolComponent', (status, msg) => {
      console.log('LOGIN STATUS CHANGED');
      console.log(status);
      console.log(msg);
      if (status.status === 'success') {
        this.isGuest = false;
        this.closeTooltip();
      } else if (status.status === 'failed') {
        this.isGuest = true;
      }
    });
  }

  isValid(str): any {
    if (str == null || str === undefined || str === ' ' || str === '' || str === 'null' || str === 'undefined') {
      return false;
    } else { return true; }
  }
  @HostListener('window:keyup.esc', ['$event'])
  escapeKeyPressed(event: KeyboardEvent): any {
    console.log('esc clicked, geotray', event);
    this.resetSelectedOption();
  }
  resetSelectedOption(): void {
    this.selectedOption = '';
  }
  selectGeosolOption(currOption): void {
    console.log('clicked the geosol buttons ', this.isGuest, currOption);

    /* if(this.isGuest || this.isGuest === undefined) {
      if(currOption === 'presentation' || currOption === 'analysis' || currOption === 'management'
      || currOption === 'production' || currOption === 'referencing'||
      currOption === 'observations' || currOption === 'applications' || currOption === 'awareness'
      || currOption === 'frameworks' || currOption === 'concepts') {
        this.observ.initiateAuthenticationRequest({from: 'geosol'});
        return;
      }
    } */
    let showAwareness = false;
    let isPreviousOptionAwareness = false;
    if (currOption === this.selectedOption) {
      this.resetSelectedOption();
      showAwareness = false;
    } else {
      if (this.selectedOption === 'awareness') {
        isPreviousOptionAwareness = true;
      }
      this.selectedOption = currOption;
      showAwareness = true;
    }
    if (currOption === 'awareness') {
      const viewMode = {
        mode: 'awareness',
        show: showAwareness,
        timestamp: new Date().getTime(),
        from: 'awareness',
        op: ''
      };
      this.toggleAwareness.emit(viewMode);
    } else  if (isPreviousOptionAwareness){
      const viewMode = {
        mode: 'awareness',
        show: false,
        timestamp: new Date().getTime(),
        from: 'awareness',
        op: ''
      };
      this.toggleAwareness.emit(viewMode);
    }
    if (this.selectedOption === 'referencing'){
      console.log('GEO REF ENABLED');
      this.observ.updateGeorefToggleStatus(true);
    } else {
      console.log('GEO REF DISABLED');
      this.observ.updateGeorefToggleStatus(false);
    }
  }
  ngOnChanges(changes: {[key: string]: SimpleChange}): any {
    console.log('IN GEOSOL CHANGES');
    console.log(changes);
    if (this.commonService.isValid(changes.awarenessCurrentMode)) {
      if (this.commonService.isValid(changes.awarenessCurrentMode.currentValue)) {
        console.log(this.awarenessCurrentMode);
        console.log(this);
        if (this.selectedOption === 'awareness') {
          if (this.awarenessCurrentMode.mode === 'capture' || !this.awarenessCurrentMode.show){
            this.selectedOption = '';
          }
        }
      }
    }
  }
  ngOnInit(): any {
    console.log(this);
    this.basemapService.onLoadScaleLine.subscribe((element) => {
      console.log('trigged when added layer or zooming ', element);
      this.getMapProjectionUnits();
      this.getScaleLineWidth();
    });
    this.getMapProjectionUnits();
    this.getScaleLineWidth();
    this.basemapService.getCurrentBasemap().on('moveend', (e) => {
      // console.log(e);
      this.getMapProjectionUnits();
      // this.basemapService.setLoadScaleLine();
    });
    Draggable.create('#rotationImgID', {
      type: 'rotation',
      throwProps: true,
      // bounds: { minRotation: -23, maxRotation: 337 },
      onDrag: (e) => {
        // console.log(e);
        let target = null;
        if (e.target.tagName === 'SPAN') {
          target = e.target.parentNode || e.target.parentElement;
        } else if (e.target.id === 'rotationImgID') {
          target = e.target;
        } else {
          console.log('OTHER ELEMENT');
        }
        if (this.isValid(target)) {
          // console.log('VALID TARGET...');
          const element = target; // e.target;
          // console.log(element);
          // console.log(element._gsTransform);
          let angle = element._gsTransform.rotation;
          // console.log(e, angle, element);
          // Here code call for setting the angle to base map
          angle = angle + 23;
          this._setRotation(angle);
        } else {
          // console.log('INVALID TARGET...');
        }
      },
      onDragEnd: (e) => {
        let target = null;
        if (e.target.tagName === 'SPAN') {
          target = e.target.parentNode || e.target.parentElement;
        } else if (e.target.id === 'rotationImgID') {
          target = e.target;
        } else {
          console.log('OTHER ELEMENT');
        }
        if (this.isValid(target)) {
          // console.log('VALID TARGET...');
          const element = target; // e.target;
          let angle = element._gsTransform.rotation;
          console.log(angle, element);
          // Here code call for setting the angle to base map
          angle = angle + 23;
          this._setRotation(angle);
        } else {
          // console.log('INVALID TARGET...');
        }
      }
    });
    try{
      this._updateDraggableObj();
    } catch (e){
      console.log(e);
    }
    this.form.controls.unitCtrl.valueChanges.subscribe(val => {
      console.log('Unit value changed', this.form.controls.unitCtrl.value);
      console.log(val);
      this.submit();
    });
    this.innerWidth = window.innerWidth;

    this.basemapService.onLoadOrientation.subscribe(rotationValue => {
      console.log('Rotation value from Tray tool ', rotationValue);
      try{
        const globeIconDraggable = Draggable.get('#rotationImgID');
        TweenLite.set('#rotationImgID', { rotation: rotationValue - 23 });
        globeIconDraggable.update();
      } catch (e){
        console.log(e);
      }
    });
    setTimeout(() => {
      this.observ.updateReferenceSystem(this.selectedReferenceSystem);
    }, 1000);
  }

  ngAfterViewInit(): any {
    setTimeout(() => {
      this.orientationActive = true;
    }, 1000);
    this.closeTooltip();
  }

  setDefaultPosition(event): any {
    this._updateDraggableObj();
    this._setRotation(0);
  }

  private _updateDraggableObj(): any {
    const globeIconDraggable = Draggable.get('#rotationImgID');
    TweenLite.set('#rotationImgID', { rotation: -23 });
    globeIconDraggable.update();
  }

  private _setRotation(rotationValue): any {
    this.basemapService.isOrientationEvent = true;
    this.basemapService.getCurrentBasemap().getView().setRotation(Math.PI / 180 * rotationValue);
    this.basemapService.isOrientationEvent = false;
    this.rotationAngle.setValue(rotationValue);
  }

  toogleTopRightMenu(event): any {
    this.topRightMenuToogle = !this.topRightMenuToogle;
  }

  loadDefaultLayers(): any {
    this.basemapService.setLoadDeafultLayers();
  }
  openMeasureUnitsChangePopup(event, content): any {
    console.log('openMeasureUnitsChangePopup');
    console.log(event);
    /* this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.resetSelectedOption();
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    }); */
  }
  showBlog(): void{
    // this.showConceptSplashScreen = true;
    console.log('IN SHOW BLOG');
    this.triggerToShowFeSpalsh.emit(true);
    // window.open('https://mapsolgeo.com/fe/home.html', '_blank');
  }
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }
  valueChanged(event): any {
    console.log('valueChanged');
    console.log(event);
  }
  submit(): any {
    this.basemapService.getCurrentBasemap().controls.forEach(control => {
      console.log('what is control here ', control);
      if (control.values_ !== null && control.values_.units !== undefined) {
        this.basemapService.getCurrentBasemap().removeControl(control);
        control.setUnits(this.form.controls.unitCtrl.value);
        // this.mapProjectionUnits = this.setMapProjectionUnits(control.renderedHTML_);
        this.mapProjectionUnits = this.setMapProjectionUnits(control.element.innerText);
        this.basemapService.getCurrentBasemap().addControl(control);
      }
    });
    this.observ.updateUnits(this.form.controls.unitCtrl.value);
    // this.modalService.dismissAll('close');
    localStorage.setItem('unit', this.form.controls.unitCtrl.value);
  }
  getScaleLineWidth(): any {
    setTimeout(() => {
      try {
        const mapControlCollection: any[] = this.basemapService.getCurrentBasemap().getControls().array_;
        // console.log(mapControlCollection);
        mapControlCollection.forEach(element => {
          // console.log(element);
          // console.log(element.renderedWidth_);
          if (this.isValid(element.renderedWidth_)) {
            this.scaleLineWidth = element.renderedWidth_;
          }
        });
        console.log('SCALE LINE WIDTH : ', this.scaleLineWidth);
      } catch (e) {
        console.log(e);
      }
    }, 1000);
  }
  zoomIn(): any {
    // console.log(this.basemapService.getCurrentBasemap().getView());
    // console.log(this.basemapService.getCurrentBasemap().getView().getZoom());
    const currentZoom = this.basemapService.getCurrentBasemap().getView().getZoom();
    const maxZoom = this.basemapService.getCurrentBasemap().getView().getMaxZoom();
    this.getScaleLineWidth();
    if (currentZoom < maxZoom) {
      this.basemapService.getCurrentBasemap().getView().setZoom(this.basemapService.getCurrentBasemap().getView().getZoom() + 1);
      this.getMapProjectionUnits();
    }
  }
  zoomOut(): any {
    const currentZoom = this.basemapService.getCurrentBasemap().getView().getZoom();
    const minZoom = this.basemapService.getCurrentBasemap().getView().getMinZoom();
    this.getScaleLineWidth();
    if (currentZoom > minZoom) {
      this.basemapService.getCurrentBasemap().getView().setZoom(this.basemapService.getCurrentBasemap().getView().getZoom() - 1);
      this.getMapProjectionUnits();
    }
  }
  getMapProjectionUnits(): any {
    this.basemapService.getCurrentBasemap().controls.forEach(control => {
      if (this.commonService.isValid(control.values_)) {
        if (control.values_.units !== undefined) {
          setTimeout(() => {
            // console.log('Here scal line ', control, control.renderedHTML_, control.element.innerText);
            this.mapProjectionUnits = this.setMapProjectionUnits(control.element.innerText);
          }, 1000);
        }
      }
    });
  }
  setMapProjectionUnits(val): any {
    const tempArr = val.split(' ');
    if (tempArr.length > 1) {
      // Here adding new code for view factory related
      const scaleLine = tempArr[3].match(/\d+/g);
      const scalByHalf = Number(scaleLine) / 2;
      const value = tempArr[2].slice(0, tempArr[2].length - (scalByHalf.toString().length)).slice(0, -1); // .replace(/\,/g, '');
      console.log(tempArr, ' :: ', scaleLine, ' : ', value);
      const viewFactory = tempArr[0] + tempArr[1] + value;
      this.observ.updateViewFactory(viewFactory);
      if (scaleLine.includes('.')) {
        let fixedNum = scaleLine.substr(scaleLine.indexOf('.') + 1).length;
        // console.log(fixedNum);
        if (fixedNum > 5) {
          // console.log('MORE THAN 5. SETTING TO 5');
          fixedNum = 5;
        }
        return String(Number(scaleLine).toFixed(fixedNum)) + ' ' + tempArr[4];
      } else {
        return scaleLine + ' ' + tempArr[4];
      }
    } else {
      return val;
    }
  }
  @HostListener('window:resize', ['$event'])
  onResize(event): any {
    // console.log(event);
    // console.log(this);
    this.innerWidth = window.innerWidth;
  }
  toggleOptions(from = 'all'): any {
    // console.log(new Date().getTime() - this.lastClickHappend);
    if (new Date().getTime() - this.lastClickHappend > 500) {
      // console.log('CLICKED A WHILE AGO...');
    } else {
      // console.log('EARLY CLICK...');
      return;
    }
    this.lastClickHappend = new Date().getTime();
    if (from === 'all') {
      if (this.isLeftWingExpanded || this.isRightWingExpanded) {
        this.isLeftWingExpanded = this.isRightWingExpanded = false;
        setTimeout(() => {
          this.leftWingContainerWidth = '0px';
          this.rightWingContainerWidth = '0px';
        }, 500);
      } else {
        this.leftWingContainerWidth = ((this.iconWidth * 5) + 45) + 'px'; // '320px';
        this.rightWingContainerWidth = ((this.iconWidth * 5) + 45) + 'px'; // '320px';
        setTimeout(() => {
          this.isLeftWingExpanded = this.isRightWingExpanded = true;
        }, 100);
      }
    } else if (from === 'left') {
      // this.isLeftWingExpanded=!this.isLeftWingExpanded;
      if (this.isLeftWingExpanded) {
        this.resetSelectedOption();
        this.isLeftWingExpanded = false;
        setTimeout(() => {
          this.leftWingContainerWidth = '0px';
        }, 500);
      } else {
        this.leftWingContainerWidth = ((this.iconWidth * 5) + 45) + 'px'; // '320px';
        setTimeout(() => {
          this.isLeftWingExpanded = true;
        }, 100);
      }

    } else if (from === 'right') {
      if (this.isRightWingExpanded) {
        this.isRightWingExpanded = false;
        setTimeout(() => {
          this.rightWingContainerWidth = '0px';
        }, 500);
      } else {
        this.rightWingContainerWidth = ((this.iconWidth * 5) + 45) + 'px'; // '320px';
        setTimeout(() => {
          this.isRightWingExpanded = true;
        }, 100);
      }
    }
  }
  showAppInfo(event, content): any {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.resetSelectedOption();
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }
  changeView(epsgCodee, latVal, lngVal): any {
    const newProj = get(epsgCodee); // .setExtent(extent_);
    let view = this.basemapService.getCurrentBasemap().getView();
    view = new OlView({
      projection: newProj,
      center: [latVal, lngVal],
      zoom: 4
    });
    this.basemapService.getCurrentBasemap().setView(view);
    // this.observ.updateMapReferenceSystem(this.epsgCodee);
    console.log('new current map ', this.basemapService.getCurrentBasemap().getLayers());
    console.log('epsgCodee is', this.epsgCodee);
  }
  
  projectionChangeEvent(epsgCode, projdef): any {
    this.passInputValue.emit(`${epsgCode}`)
    this.epsgCodee='EPSG:' +epsgCode;
    console.log(this.epsgCodee,"check epsgcode from change evt")
    this.changeService.sendData(this.epsgCodee)

    // const extent2100 = [-34387.6695, 3691163.5140, 1056496.8434, 4641211.3222];
    console.log('selected epsgCode ', epsgCode);
    console.log('selected epsgCode ', this.epsgCodee);
    const index = this.referenceSystemTypes.findIndex(refSys => String(refSys.value) === String(epsgCode));
    if (index !== -1) {
      this.selectedReferenceSystem = this.referenceSystemTypes[index];
      this.observ.updateReferenceSystem(this.selectedReferenceSystem);   
    }
    this.getProjDef(this.epsgCodee).subscribe( projdef => {
     
      proj4.defs(this.epsgCodee, projdef);
      register(proj4);
      this.changeView(this.epsgCodee, 510457.300375, 4150059.924838);
      console.log(projdef, 'projdef')

    console.log(this.selectedReferenceSystem , 'selected epsg projection value');
  });
}
  private getProjDef(epsgCodee): Observable<any> {
    return new Observable(observer => {
      let projdef = '+proj=lcc +lat_1=35.46666666666667 +lat_2=34.03333333333333 +lat_0=33.5 +lon_0=-118' +
    ' +x_0=2000000.0001016 +y_0=500000.0001016001 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs';
      fetch('https://epsg.io/?format=json&q=' + this.epsgCodee.split(':')[1])
    .then((response) => {
      return response.json().then((jsonData) => {
      const results = jsonData.results;
      console.log('getting proj4 result ', results);
      console.log('find epsgcodee in getProjdef ', epsgCodee);
      console.log('find projdef in getprojdef before results ', projdef);
      if (results && results.length > 0) {
        console.log('find projdef in getprojdef after results ', projdef);
        for (let i = 0, ii = results.length; i < ii; i++) {
          
          const result = results[i];
          if (result) {
            const code = result.code;
            const name = result.name;
            const proj4def = result.proj4;
            console.log('find proj4def ', proj4def);
            const bbox = result.bbox;
            if (proj4def && proj4def.length > 0) {    
              projdef = proj4def;
              console.log('find proj4def and projdef ', proj4def, projdef);
              observer.next(projdef);
              observer.complete();
              // this.projectionChangeEvent(this.epsgCodee, proj4def)
              return;
            }
          }
        }
      } else {
        this.epsgCodee = 'NO-EPSG';
        console.log('no result for epsg ', this.epsgCodee);
      }
      observer.next(projdef);
      observer.complete();
      });
    });
    });
  }
 

  showCompass(): any {
    console.log('In showCompass');
    console.log(this.compassOpenState);
    if (!this.compassOpenState) {
      this.compassOpenState = true;
      // this.showCompassCtrl.emit(new Date().getTime());
      this.showCompassCtrl = String(new Date().getTime());
    } else {
      this.compassOpenState = false;
      // this.closeCompassCtrl.emit(new Date().getTime());
      this.closeCompassCtrl = String(new Date().getTime());
    }
  }
  compassClosedEventFun(): void{
    this.compassOpenState = false;
  }
  displayFullMap(): any {
    console.log('In displayFullMap');
    this.basemapService.getCurrentBasemap().getView().setZoom(2);
  }
  closeTooltip(): void{
    if (!this.isGuest){
      setTimeout(() => {
        this.showTooltip = false;
      }, environment.feUserGuideTooltipAutoCloseDuration);
    }
  }
  openFrameworkForm(): any{
    this.showFrameworkForm = !this.showFrameworkForm;
  }
  filterMapTypes(mapType, mapRealname): any {
    // const mapType = mapTypeObj.value;
    // console.log('what is map type: ', mapType, this.isBaseMapOptActive);
    // this.mapTypeName = mapType;
    // this.selecteMapType = mapTypeObj;
    this.authObsr.updateBaseLayerName(mapRealname);
    // this.isBaseMapOptActive = !this.isBaseMapOptActive;
    // #TODO - later this code need to be simply & easly...
    this.basemapService.getCurrentBasemap().getLayers().forEach(layer => {
      console.log('layer name ', mapType, layer.values_.name, layer.getVisible());
      if (mapType === 'openstreet') {
        if (layer.values_.name === 'satellite' || layer.values_.name === 'terrain'
        || layer.values_.name === 'toner' || layer.values_.name === 'bingsatellite'
        || layer.values_.name === 'bingstreet' || layer.values_.name === 'googlestreet' || layer.values_.name === 'googlesatellite') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'openstreet') {
          layer.setVisible(true);
        }
      }
      if (mapType === 'satellite') {
        if (layer.values_.name === 'openstreet' || layer.values_.name === 'terrain'
        || layer.values_.name === 'toner' || layer.values_.name === 'bingsatellite'
        || layer.values_.name === 'bingstreet' || layer.values_.name === 'googlestreet' || layer.values_.name === 'googlesatellite') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'satellite') {
          layer.setVisible(true);
        }
      }
      if (mapType === 'terrain') {
        if (layer.values_.name === 'satellite' || layer.values_.name === 'openstreet'
        || layer.values_.name === 'toner' || layer.values_.name === 'bingsatellite'
        || layer.values_.name === 'bingstreet' || layer.values_.name === 'googlestreet' || layer.values_.name === 'googlesatellite') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'terrain') {
          layer.setVisible(true);
        }
      }

      if (mapType === 'toner') {
        if (layer.values_.name === 'satellite' || layer.values_.name === 'openstreet'
        || layer.values_.name === 'terrain' || layer.values_.name === 'bingsatellite'
        || layer.values_.name === 'bingstreet' || layer.values_.name === 'googlestreet' || layer.values_.name === 'googlesatellite') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'toner') {
          layer.setVisible(true);
        }
      }

      if (mapType === 'bingsatellite') {
        if (layer.values_.name === 'satellite' || layer.values_.name === 'openstreet'
        || layer.values_.name === 'terrain' || layer.values_.name === 'toner'
        || layer.values_.name === 'bingstreet' || layer.values_.name === 'googlestreet' || layer.values_.name === 'googlesatellite') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'bingsatellite') {
          layer.setVisible(true);
        }
      }
      // New code for street view of bing
      if (mapType === 'bingstreet') {
        if (layer.values_.name === 'openstreet' || layer.values_.name === 'terrain'
        || layer.values_.name === 'toner' || layer.values_.name === 'bingsatellite'
        || layer.values_.name === 'googlestreet' || layer.values_.name === 'satellite' || layer.values_.name === 'googlesatellite') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'bingstreet') {
          layer.setVisible(true);
        }
      }

      // New code for street view of bing
      if (mapType === 'googlestreet') {
        if (layer.values_.name === 'openstreet' || layer.values_.name === 'terrain'
        || layer.values_.name === 'toner' || layer.values_.name === 'bingsatellite'
        || layer.values_.name === 'bingstreet' || layer.values_.name === 'satellite' || layer.values_.name === 'googlesatellite') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'googlestreet') {
          layer.setVisible(true);
        }
      }

      // New code for satellite view of google
      if (mapType === 'googlesatellite') {
        if (layer.values_.name === 'openstreet' || layer.values_.name === 'terrain'
        || layer.values_.name === 'toner' || layer.values_.name === 'bingsatellite'
        || layer.values_.name === 'bingstreet' || layer.values_.name === 'satellite' || layer.values_.name === 'googlestreet') {
          layer.setVisible(false);
        } else if (layer.values_.name === 'googlesatellite') {
          layer.setVisible(true);
        }
      }
    });
  }
}
