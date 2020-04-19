import { Component, ViewChild, ElementRef } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@ionic-native/native-geocoder/ngx';
import { Marker } from '../models/marker';
import { AlertController } from '@ionic/angular';
import { FirebaseServiceService } from '../services/firebase-service.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthenticationService } from '../services/authentication.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

declare var google;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  @ViewChild('map', {static: false}) mapElement: ElementRef;
  map: any;
  address:string = "";
  marker: any;
  line: any;
  areIndicatorsLoaded : boolean = false;
  arrayMarkers: Marker[] = [];
  isSharingLocation: Boolean;
  lastAlert: Date;
  lastSafe: Date;
  dontAskAgain: Boolean;
  srcIndicator: string;
  userZone: string;
  actualUbication: any;
  mapOptions: any;
  isTracking: boolean;
  postionSubscription: Subscription;
  trackingUbication: string;
  lastTrackUbication: any;
  isShowingMessage: boolean;
  locations: any;
  dataUbication: any[];
  arrayLocalities: any[];

  private options: NativeGeocoderOptions = {
    useLocale: true,
    maxResults: 5
  }; 

  constructor(

    private geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder,
    private alertController: AlertController,
    private firebasService: FirebaseServiceService,
    private authService: AuthenticationService,
    private db: AngularFirestore,

    ) {
    this.mapOptions = {      
      zoom: 17,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    }
    this.isSharingLocation = false;
    this.lastAlert = null;
    this.lastSafe = null;
    this.dontAskAgain = false;
    this.srcIndicator = "";
    this.actualUbication = null;
    this.trackingUbication = "";
  }
  
  ngOnInit() {}
  
  ngAfterViewInit(){    
    this.loadMap();
  }

  async loadMap() {
    this.map = new google.maps.Map(this.mapElement.nativeElement, this.mapOptions);    
    this.whereIAm();
    this.startTracking();    
    
  }
  
  centerMap(){    
    this.map.setCenter(this.actualUbication);
    this.map.setZoom(17);
  }

  whereIAm() { 
    var data = [];   
    this.geolocation.getCurrentPosition().then((resp) => {
      var coords = resp.coords;
      let latLng = new google.maps.LatLng(coords.latitude, coords.longitude);   
      this.actualUbication = {lat: coords.latitude, lng: coords.longitude};
      this.map.setCenter(latLng);
      this.map.setZoom(17);      
      this.getAddressFromCoords(coords.latitude, coords.longitude);
      
      /*this.map.addListener('tilesloaded', () => {        
        this.getAddressFromCoords(this.map.center.lat(), this.map.center.lng());        
      });*/
    }).catch((error) => {
      this.address =  "Error in where i am: "+  error;
    }); 
    return data;   
  }

  startTracking(){    
    this.trackingUbication = "Track: ";
    this.postionSubscription = this.geolocation.watchPosition()
    .pipe(
      filter(p => p.coords != undefined)
    )
    .subscribe( data => {
      setTimeout(() =>{
        var myLatLng = new google.maps.LatLng(data.coords.latitude, data.coords.longitude);        
        this.trackingUbication +=  myLatLng +"\r\n";
        this.actualUbication = {lat: data.coords.latitude, lng: data.coords.longitude};        
        this.setUserMarker();
        this.getNearestLocation();
      });
    });
  }

  async loadIndicators(){
    var data = this.dataUbication;
    /* this.createIndicator("Colombia Quindio Armenia Institucion educativa nuestra señora el belén",3);
    this.createIndicator("Colombia Quindio Armenia Vetcenter Centro veterinario",2);
    this.createIndicator("Colombia Quindio Armenia Iglesia el belén",3);
    this.createIndicator("Colombia Quindio Armenia el placer",3);
    this.createIndicator("Colombia Quindio Armenia Comedor colegio nuestra señora de belen",1);    */

    if(data != null && data.length == 3 ){
      var country    = data[0];
      var department = data[1];
      var city       = data[2];
      this.address += country +" "+ department +" "+ city;
      this.getLocations("Colombia","Quindío","Armenia"); 
      
      
    }
    
  }
  
  createIndicator(location,indicator){        
    this.nativeGeocoder.forwardGeocode(location, this.options)
    .then((result: NativeGeocoderResult[]) =>{
      if( location != null && location != ""){
        var lat = parseFloat(result[0].latitude);
        var long = parseFloat(result[0].longitude);
        var marker = new Marker({lat: lat, lng: long}, location, indicator);        
        this.arrayMarkers.push(marker);
        this.setMarker(lat, long, indicator,"Titulo",location);
      }
    })
    .catch((error: any) => this.address += "Error en create" + error);
  }
  
  setMarker(lat,long, indicator = null, title = "", body = ""){
    
    var marker;
    var myLatLng = null;
    var map = this.map;
    

    if(lat != null && long != null && indicator != null && typeof indicator != 'undefined'){
          
      myLatLng = {lat: lat, lng: long};
      
    if(indicator == "user"){
      if(this.lastTrackUbication != null && lat == this.lastTrackUbication["lat"] && long == this.lastTrackUbication["lng"]){
        return;
      }

      if(this.marker){
        this.marker.setMap(null);
      }
      this.lastTrackUbication = myLatLng;

      marker = new google.maps.Marker({
        position: myLatLng,
        map: map
      });

      this.marker = marker;
      
    }else{

      if(body != "" && title != ""){

        var contentCard = '<div id="content">';
        contentCard += ( title ? '<h1 id="firstHeading" class="firstHeading">'+title+'</h1>' : "");
        contentCard += ( body  ? '<div id="bodyContent">'+body+'</div>' : "");
        contentCard += '</div>';
      
        var infowindow = new google.maps.InfoWindow({
          content: contentCard
        });

        indicator = String(indicator);

        var url = this.getIcon(indicator);
        
        marker = new google.maps.Marker({
          position: myLatLng,
          map: map,
          icon: url
        });        

        marker.addListener('click', function() {
          infowindow.open(map, marker);          
          marker.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(function () {
            marker.setAnimation(null);
          }, 2000);
        });

        
          // Add the circle for this city to the map.
          var cityCircle = new google.maps.Circle({
            strokeColor: '#DAD7D6',
            strokeOpacity: 0.8,
            strokeWeight: 1,
            fillColor: this.getColor(indicator),
            fillOpacity: 0.35,
            map: map,
            center: myLatLng,
            radius: 70
          });
        
      }
      }
    }      
  }
   
  getAddressFromCoords(lattitude, longitude) {
    
    var data = "";
    var arrayData = [];
    var headers = ["countryName", "administrativeArea","locality"]; //,"thoroughfare"];
    var info;
    this.nativeGeocoder.reverseGeocode(lattitude, longitude, this.options)
      .then((result: NativeGeocoderResult[]) => {
        info = result[0];      
        headers.map((header)=> {  
          data+= info[header] +",";        
        });  
        arrayData = data.split(",");
        arrayData.pop();
        this.dataUbication = arrayData; 
        this.loadIndicators();
      })
      .catch((error: any) =>{         
        this.address += "Error in get addres from coords: " + error;
      });       
    
    
  }

  getNearestLocation(){
    var nearDistance = null;
    var nearMarker;
    var userLat = this.actualUbication["lat"];
    var userLong = this.actualUbication["lng"];

    this.arrayMarkers.map((marker) =>{      
      var coord = marker.coords;
      var distance = Math.sqrt(Math.pow(coord.lat - userLat,2) + Math.pow(coord.lng - userLong,2));
      if(nearDistance == null || nearDistance > distance ){
        nearDistance = distance;
        nearMarker = marker;        
      }
    });

    var path =  [
      {lat: parseFloat(nearMarker.coords.lat), lng: parseFloat(nearMarker.coords.lng)},
      {lat: parseFloat(userLat) ,       lng: parseFloat(userLong)} 
    ];

    this.createLineBetweenPoints(path);   
    
    var info = this.getMessage(nearMarker.indicator);
    this.userZone = info[0];
    (<HTMLInputElement> document.getElementById("indicatorUbication")).className = info[1]
    if(!this.isShowingMessage && !this.dontAskAgain && nearMarker.indicator == 1 && !this.isSharingLocation && this.askAlertAgain()){
      this.isShowingMessage = true;
      this.notifyAlert();
    }
    
    if(!this.isShowingMessage && !this.dontAskAgain && nearMarker.indicator != 1 && this.isSharingLocation && this.askSafeAgain()){
      this.isShowingMessage = true;
      this.notifySafe();
    }
  }
  
  async shareUbication(){
    var uid = this.authService.getActualUser();
    var i = 1;
    if(this.isSharingLocation){
      this.firebasService.saveNewUbication(JSON.stringify(this.actualUbication),uid);
      
    }
    var interval = setInterval(() => {      
      if(!this.isSharingLocation || i == 20){
       clearInterval(interval); 
      }
      else{
        this.address = "Share location: " +  (i++)+" " + JSON.stringify(this.actualUbication);
        this.firebasService.saveNewUbication(JSON.stringify(this.actualUbication),uid);
      }      
    }, 5000);   
  }

  shareLocationClick(){
    this.isSharingLocation = !this.isSharingLocation;
    if(this.isSharingLocation){
      this.shareUbication();
    }
  }

  async notifySafe(){
    const alert = await this.alertController.create({
      header: '¡Sugerencia!',
      message: 'Estás entrando en una zona de bajo riesgo. <br/><br/>¿Deseas continuar compartiendo tu ubicación?',
      buttons: [
        {
          text: 'Si',
          cssClass: 'primary',
          handler: () => {
            this.lastSafe = new Date();
            this.isShowingMessage = false;
          }
        }, {
          text: 'No',
          handler: () => {
            // sleep()
            this.isShowingMessage = false;
            this.isSharingLocation = false;
          }        
        }, {
          text: 'No preguntar de nuevo',
          handler: () => {
            // sleep()
            this.isShowingMessage = false;
            this.dontAskAgain = true;
          }
        }
      ] 
    });

    await alert.present();
  }


  async notifyAlert() {
    const alert = await this.alertController.create({
      header: '¡Precaución!',
      message: 'Estás entrando en una zona riesgosa. <br/><br/>¿Deseas compartir tu ubicación?',
      buttons: [
        {
          text: 'Si',
          cssClass: 'primary',
          handler: () => {            
            this.isSharingLocation = true;
            this.isShowingMessage = false;
            this.shareUbication();
          }
        }, {
          text: 'No',
          handler: () => {
            this.isShowingMessage = false;
            this.lastAlert = new Date();
          }
        }, {
          text: 'No preguntar de nuevo',
          handler: () => {
            // sleep()
            this.dontAskAgain = true;
            this.isShowingMessage = false;
          }
        }
      ] 
    });

    await alert.present();
  }

  createLineBetweenPoints(path){
    var lineSymbol = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      scale: 2
    };

    if(this.line){
      this.line.setMap(null);
    }
    var line = new google.maps.Polyline({
      path,
      strokeColor: "#ff1a1a",
      strokeOpacity: 0,
          icons: [{
            icon: lineSymbol,
            offset: '0',
            repeat: '20px'
          }],
      map: this.map
    });
    this.line = line;
  }

  askAlertAgain(){
    return this.compareDates(this.lastAlert);
  }

  askSafeAgain(){
    return this.compareDates(this.lastSafe);
  }

  compareDates(date){
    if(date == null){
      return true;
    }
    var actualDate = new Date();
    var minutes  = actualDate.getTime() - date.getTime();
    minutes /= (1000*60);
    if(minutes >= 5){
      return true;
    }
    return false;
  }


  getIcon(indicator){
    switch (indicator){
      case "3":
        return '../../assets/icon/green-dot.png';
      case "2":
        return '../../assets/icon/yellow-dot.png';
      case "1":
       return '../../assets/icon/red-dot.png';
      case "user":
       return '../../assets/icon/user.png';
    }
  }

  getColor(indicator){
    switch (indicator){
      case "3":
        return 'green';
      case "2":
        return 'yellow';
      case "1":
       return 'red';
    }
  }

  getMessage(indicator){
    indicator = String(indicator);
    switch (indicator){
      case "3":
        return ['Zona de bajo riesgo','lowRisk'];
      case "2":
        return ['Zona de medio riesgo','mediumRisk'];
      case "1":
       return ['Zona de alto riesgo','highRisk'];
    }
  } 

  setUserMarker(){
    
    this.setMarker(this.actualUbication.lat,this.actualUbication.lng, "user");
  }

  getLocations(country,department,city){
    this.arrayLocalities = [];
    var countryRef = this.db.collection("countries");
    countryRef = this.db.collection('/countries', ref => ref.where('country', '>=', country));
    countryRef.get()
    .toPromise()
    .then((querySnapshot) => {      
      querySnapshot.forEach((countryObj) => {
        countryObj.ref.collection("departments").where("department",">=",department).get().then((querySnapshot) => {      
          querySnapshot.forEach(cityObj => {
            cityObj.ref.collection("cities").where("city",">=",city).get().then((querySnapshot) => {      
              querySnapshot.forEach(localityObj => {                
                localityObj.ref.collection("locations").get().then((querySnapshot)=> {                                   
                  querySnapshot.forEach(locality => {
                    this.arrayLocalities.push(JSON.stringify(locality.data()));
                    let localityObj = locality.data();
                    var query = country +" "+ department +" "+ city +" "+ localityObj["location"];
                    this.createIndicator(query, localityObj["ranking"]);  
                  });
                });
              });      
            });
          });      
        });
      });
    });
    
    
    
  }
}
