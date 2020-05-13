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
import { Storage } from '@ionic/storage';
import { AngularFireDatabase } from '@angular/fire/database';
import { Country, Department, City, Location } from '../models/country';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from "rxjs/operators";
declare var google;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  @ViewChild('map', {static: false}) mapElement: ElementRef;
  map: any;
  error:string = "";
  console:string = "";
  marker: any;
  line: any;
  areIndicatorsLoaded : boolean = false;
  arrayMarkers: Marker[] = [];
  isSharingLocation: Boolean;
  lastAlert: Date;
  lastSafe: Date;
  dontAskAgain: Boolean;
  srcIndicator: string;
  userTheftZone: string;
  userTerrorismZone: string;
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
  localitiesLoaded: string[];
  placetoSearch: string = "";
  uid: string = "";
  markerShareUbication: any = null;
  private options: NativeGeocoderOptions = {
    useLocale: true,
    maxResults: 5
  }; 

  constructor(

    private geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder,
    private alertController: AlertController,
    private firebaseService: FirebaseServiceService,
    private authService: AuthenticationService,
    private db: AngularFirestore,
    private af: AngularFireDatabase,
    private storage: Storage,
    private _http: HttpClient

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
    this.localitiesLoaded = [];
    this.getUid();
    this.getGeoCodefromGoogleAPI("Armenia quindio el placer").subscribe(addressData => {
      let lat: string = addressData.results[0].geometry.location.lat;
      let long: string = addressData.results[0].geometry.location.lng;
      console.log("Geo:",lat,long);
     });
    
   // this.getLocations("c","Quindio","Armenia");
  }
  
  ngOnInit() {}
  
  ngAfterViewInit(){    
    this.loadMap();
  }

 

  async loadMap() {
    this.map = new google.maps.Map(this.mapElement.nativeElement, this.mapOptions);    //create the map
    this.initAutocomplete();
    this.whereIAm();
    this.startTracking();        
  }
  searchInfoPlace(){
    
    var place = this.placetoSearch;

    if( place != null && place != "" ){   
      
      this.getGeoCodefromGoogleAPI(place).subscribe(addressData => {
        console.log("Address",addressData.results[0]);
        let lat: string = addressData.results[0].geometry.location.lat;
        let long: string = addressData.results[0].geometry.location.lng;
        this.map.setCenter({lat: lat, lng: long});
        this.map.setZoom(17);     
        this.getAddressFromCoords(lat,long);
       });
    }
    
  }
  initAutocomplete() {
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    this.map.addListener('bounds_changed', function() {
      searchBox.setBounds(this.map.getBounds());
    });
  }
  
  centerMap(){    
    this.map.setCenter(this.actualUbication);
    this.map.setZoom(17);
  }

  whereIAm() { 
    var data = [];   
    this.geolocation.getCurrentPosition().then((resp) => {
      var coords = resp.coords;
      this.actualUbication = {lat: coords.latitude, lng: coords.longitude};
      this.centerMap();    
      this.getAddressFromCoords(coords.latitude, coords.longitude);      
      /*this.map.addListener('tilesloaded', () => {        
        this.getAddressFromCoords(this.map.center.lat(), this.map.center.lng());        
      });*/
    }).catch((error) => {
      this.error =  "Error in where i am: "+  error;
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
        //this.actualUbication = {lat: data.coords.latitude, lng: data.coords.longitude};        
        this.actualUbication = {lat: this.map.center.lat(), lng:this.map.center.lng()}
        this.setUserMarker();
        this.getNearestLocation();
      });
    });
  }

  async loadIndicators(){
    var data = this.dataUbication;    
    if(data != null && data.length == 3 ){
      var country    = data[0];
      var department = data[1];
      var city       = data[2];
      var query      = country+" "+department+" "+city;

      if(!this.localitiesLoaded.includes(query)){
        this.localitiesLoaded.push(query);
        this.getLocations(country,department,city); 
      }      
    }
  }

  loadLocalities(dataset:Location[],query){  

    this.console += "Query: " + query;
    for(let location of dataset){
      this.createIndicator(query , location);
    }
  }
  
  createIndicator(query, location){        
    if( query != null && query != "" && location != null && location.location != ""){
    query += " " + location.location; 
    if(this.compareStrings("EL PLACER",location.location)){
      this.console = "El placer"
    }
    this.getGeoCodefromGoogleAPI(query).subscribe(addressData => {
      console.log("Address",addressData.results[0]);
      let lat: string = addressData.results[0].geometry.location.lat;
      let long: string = addressData.results[0].geometry.location.lng;
      var marker = new Marker({lat: lat, lng: long}, location.location, location.theftId, location.terrorismId);        
      this.arrayMarkers.push(marker);
      if(this.compareStrings("El placer",location.location)){
        this.console += location.location +" "+ lat +" "+ long+" - ";
      }
      
      this.createMarker(lat, long, location.theftId, location.terrorismId, location.theftRating, location.terrorismRating, location.location,"body");      
     });
    }
  }

  getGeoCodefromGoogleAPI(address: string): Observable<any> {
    return this._http.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + address+"&key=AIzaSyDzQIvZVyTi7pfm2sIg4u81vmqGx4SBF3c");      
  }
  
  
  createMarker(lat,long, theftId = "", terrorismId = "", theftRating = "", terrorismRating = "", title = "", body = ""){
    
    var marker;
    var myLatLng = null;
    var map = this.map;
    

    if(lat != null && long != null && theftId != null && typeof theftId != 'undefined'){
          
      myLatLng = {lat: lat, lng: long};
    if(theftId == "ubication"){
      if(this.markerShareUbication){
        this.markerShareUbication.setMap(null);
      }
      marker = new google.maps.Marker({
        position: myLatLng,
        map: map
      });
      this.markerShareUbication = marker;
    }
    else if(theftId == "user"){
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
        contentCard += ( title ? '<h1 style = "font-size: 18px; font-family: Cambria; margin-top: 6px">'+title+'</h1>' : "");
        contentCard += ( body  ? '<div id="bodyContent"> <strong>Nivel de riesgo hurto: </strong>'+ theftId +'</div>' : "");
        contentCard += ( body  ? '<div id="bodyContent"> <strong>Número de hurtos: </strong>'+ theftRating +'</div>' : "");
        contentCard += ( body  ? '<div id="bodyContent"> <strong>Nivel de riesgo terrorismo: </strong>'+ terrorismId +'</div>' : "");
        contentCard += ( body  ? '<div id="bodyContent"> <strong>Número de atentados: </strong>'+ terrorismRating +'</div>' : "");
        contentCard += '</div>';
      
        var infowindow = new google.maps.InfoWindow({
          content: contentCard
        });

        theftId = String(theftId);

        var url = this.getIcon(theftId);
        
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
          if(theftId != ""){
            var cityCircle = new google.maps.Circle({
              strokeColor: '#DAD7D6',
              strokeOpacity: 0.8,
              strokeWeight: 1,
              fillColor: this.getColor(theftId,"theft"),
              fillOpacity: 0.35,
              map: map,
              center: myLatLng,
              radius: 70
            });
          }

          if(terrorismId != ""){
            var cityCircle = new google.maps.Circle({
              strokeColor: this.getColor(terrorismId,"terrorism"),
              strokeOpacity: 1,
              strokeWeight: 3,
              fillOpacity: 0,
              map: map,
              center: myLatLng,
              radius: 70
            });
          }
      }
      }
    }      
  }
   
  getAddressFromCoords(lattitude, longitude) {    
    this.dataUbication = [];
    var headers = ["countryName", "administrativeArea","locality"]; //,"thoroughfare"];
    var info;
    this.nativeGeocoder.reverseGeocode(lattitude, longitude, this.options)
      .then((result: NativeGeocoderResult[]) => {
        info = result[0];      
        headers.map((header)=> {  
          
          this.dataUbication.push(info[header]);        
        });  
        this.loadIndicators();
      })
      .catch((error: any) =>{         
        this.error += "Error in get addres from coords: " + error;
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
    this.userTerrorismZone = "";
    this.userTheftZone= "";
    this.displayElement("indicatorTheft","none");
    this.displayElement("indicatorTerrorism","none");
    var infoToShow = 0;

    if(nearMarker.theftId != ""){
      var infoTheft = this.getMessage(nearMarker.theftId,"theft");      
      this.userTheftZone = infoTheft[0];
      (<HTMLInputElement> document.getElementById("indicatorTheft")).className = infoTheft[1];      
      infoToShow += 1;
      this.displayElement("indicatorTheft","inline");
    }
    
    if(nearMarker.terrorismId != ""){
      var infoTerrorism = this.getMessage(nearMarker.terrorismId,"terrorism");
      this.userTerrorismZone = infoTerrorism[0];      
      (<HTMLInputElement> document.getElementById("indicatorTerrorism")).className = infoTerrorism[1];      
      infoToShow += 1;
      this.displayElement("indicatorTerrorism","inline");
    }

    (<HTMLInputElement> document.getElementById("divisor")).style.display = (infoToShow == 2 ? "inline" : "none" );    
    
    if(!this.isShowingMessage && !this.dontAskAgain && nearMarker.theftId == 1 && !this.isSharingLocation && this.askAlertAgain()){
      this.isShowingMessage = true;
      this.notifyAlert();
    }
    
    if(!this.isShowingMessage && !this.dontAskAgain && nearMarker.theftId != 1 && this.isSharingLocation && this.askSafeAgain()){
      this.isShowingMessage = true;
      this.notifySafe();
    }
  }
  
  displayElement(element, type){
    (<HTMLInputElement> document.getElementById(element)).style.display = type;
  }

  async shareUbication(){
    
    var i = 1;
    if(this.isSharingLocation){
      this.firebaseService.saveNewUbication(JSON.stringify(this.actualUbication),this.uid);      
    }
    var interval = setInterval(() => {      
      if(!this.isSharingLocation || i == 20){
       clearInterval(interval); 
      }
      else{
        this.firebaseService.saveNewUbication(JSON.stringify(this.actualUbication),this.uid);
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
       default:
         return '../../assets/icon/blue-dot.png';
    }
  }

  getColor(indicator,key){
    if(key == "theft"){
      switch (indicator){
        case "3":
          return 'green';
        case "2":
          return 'yellow';
        case "1":
         return 'red';
      }
    }else{
      switch (indicator){        
        case "1":
          return "black";
        case "3":
          return "#8393F1";
      }
    }
  }

  async showLastUbication(ubication){
   
    ubication = JSON.parse(ubication);
    if(ubication != null && ubication != ""){
      this.createMarker(ubication["lat"],ubication["lng"],"ubication");
    }
  }

  getLastUbication(){
    var userRef = this.db.collection("/users").doc(this.uid);
   
    userRef.valueChanges()
    .subscribe(res => {
      this.showLastUbication(res["ubication"]);
    });
  }

  getMessage(indicator,type){
    indicator = String(indicator);    
    if(type == "theft"){
      switch (indicator){
        case "3":
          return ['Riesgo hurto: bajo','lowTheftRisk'];
        case "2":
          return ['Riesgo hurto: medio','mediumTheftRisk'];
        case "1":
         return ['Riesgo hurto: alto','highTheftRisk'];
      }
    }else{
      switch (indicator){
        case "3":
          return ['Riesgo terrorismo: bajo','lowTerrorismRisk'];
        case "1":
         return ['Riesgo terrorismo: alto','highTerrorismRisk'];
      }
    }
  } 

  setUserMarker(){    
    this.createMarker(this.actualUbication.lat,this.actualUbication.lng, "user");
  }

  getUid(){
    this.storage.get('uid').then((val) => {
      if(val != null && val != ""){
        this.uid = val;
      }
    });
  }
  
  async getLocationsFirebase(country, department, city){
    this.af.list("/").valueChanges().subscribe(val => {
      var countryInfo: Country = new Country(val[0],val[1]);   
      this.console += "Loaded from firebase";   
      this.storage.set("locationsArray",countryInfo);
      this.getLocationsInfo(countryInfo,department, city);      
    });
  }
  
  getLocations(country,department,city){    

    this.storage.get("locationsArray").then((res) =>{
      var countryInfo: Country;
       if(res != null && res != ""){
         countryInfo = res;
         this.console += "Loaded from store";
         this.getLocationsInfo(countryInfo,department, city);   
       }else{
          this.getLocationsFirebase(country,department,city);
       }
    });      
  } 
  
  getLocationsInfo(country,departmentQuery,cityQuery){ 
       
    var departments: Department[] = country.departments;
    for(var department of departments){
      if(this.compareStrings(department.department,departmentQuery)){
          var cities: City[] = department.cities;
          for(var city of cities){
              if(this.compareStrings(city.city,cityQuery)){
                  this.loadLocalities(city.locations, country +" "+ departmentQuery+" "+ cityQuery); 
              }
          }
      }
    }
  }

  compareStrings(var1, var2){
      var1 = this.removeAccents(var1);
      var2 = this.removeAccents(var2);
      return (var1 == var2);
  }

  removeAccents(str){
    str = str.toUpperCase();
    str = str.trim();
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
} 
}