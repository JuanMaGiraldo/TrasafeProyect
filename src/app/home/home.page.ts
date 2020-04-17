import { Component, ViewChild, ElementRef } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@ionic-native/native-geocoder/ngx';
import { Marker } from '../models/marker';
import { AlertController } from '@ionic/angular';
import { FirebaseServiceService } from '../services/firebase-service.service';


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
  private options: NativeGeocoderOptions = {
    useLocale: true,
    maxResults: 5
  }; 

  constructor(

    private geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder,
    private alertController: AlertController,
    private firebasService: FirebaseServiceService

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
  }
  
 
  ngOnInit() {
    this.loadMap();    
  }
 
  loadMap() {
    this.geolocation.getCurrentPosition().then((resp) => {
      let latLng = new google.maps.LatLng(resp.coords.latitude, resp.coords.longitude);     
      
      this.map = new google.maps.Map(this.mapElement.nativeElement, this.mapOptions);
      this.map.setCenter(latLng);
      this.map.setZoom(17);
      this.getAddressFromCoords(resp.coords.latitude, resp.coords.longitude);
      this.actualUbication = "lat: "+ resp.coords.latitude +" long: "+resp.coords.longitude;
      this.address = this.actualUbication;    
 
      /*this.map.addListener('tilesloaded', () => {
        
        this.getAddressFromCoords(this.map.center.lat(), this.map.center.lng());
        
      });*/
 
    }).catch((error) => {
      console.log('Error getting location', error);
    });    
  }

  

  loadIndicators(){
    this.createIndicator("Colombia Quindio Armenia Institucion educativa nuestra señora el belén",3);
    this.createIndicator("Colombia Quindio Armenia Vetcenter Centro veterinario",2);
    this.createIndicator("Colombia Quindio Armenia Iglesia el belén",3);
    this.createIndicator("Colombia Quindio Armenia el placer",3);
    this.createIndicator("Colombia Quindio Armenia Comedor colegio nuestra señora de belen",1);
     
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

      if(this.marker){
        this.marker.setMap(null);
      }

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
    
    this.setMarker(lattitude,longitude,"user");
    
    this.nativeGeocoder.reverseGeocode(lattitude, longitude, this.options)
      .then((result: NativeGeocoderResult[]) => {
        var info = result[0];
        var headers = ["countryName", "administrativeArea","locality","thoroughfare"];
        var data = "";

        headers.map((header)=> data += info[header]+" ");
        
        //this.address = JSON.stringify(info)+ " ----- "+ data;
        if(!this.areIndicatorsLoaded){
          this.areIndicatorsLoaded = true;
          this.loadIndicators();
        }else{
          this.getNearestLocation(lattitude,longitude);          
        }
      })
      .catch((error: any) =>{         
        this.address += "Error " + error;
      });
  }

  getNearestLocation(userLat, userLong){
    var nearDistance = null;
    var nearMarker;
    this.arrayMarkers.map((marker) =>{
      
      var coord = marker.coords;
      var distance = Math.sqrt(Math.pow(coord.lat - userLat,2) + Math.pow(coord.lng - userLong,2));
      if(nearDistance == null || nearDistance > distance ){
        nearDistance = distance;
        nearMarker = marker;        
      }
    });
    
    var info = this.getMessage(nearMarker.indicator);
    this.userZone = info[0];
    (<HTMLInputElement> document.getElementById("indicatorUbication")).className = info[1]
    if(!this.dontAskAgain && nearMarker.indicator == 1 && !this.isSharingLocation && this.askAlertAgain()){
      this.notifyAlert();
    }
    
    if(!this.dontAskAgain && nearMarker.indicator != 1 && this.isSharingLocation && this.askSafeAgain()){
      this.notifySafe();
    }
  }

  async shareUbication(){
    this.address = this.isSharingLocation+"";
    var i = 1;
    var interval = setInterval(() => {
      this.address = "sharing ubication";
      if(!this.isSharingLocation){
       clearInterval(interval); 
       this.address = "no interval";
      }
      else{
        this.address = (i++) +"";
        this.firebasService.saveNewUbication(this.actualUbication);      
      }      
    }, 2000);   
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
            
          }
        }, {
          text: 'No',
          handler: () => {
            // sleep()
            this.isSharingLocation = false;
          }        
        }, {
          text: 'No preguntar de nuevo',
          handler: () => {
            // sleep()
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
            this.shareUbication();
          }
        }, {
          text: 'No',
          handler: () => {
            this.lastAlert = new Date();
          }
        }, {
          text: 'No preguntar de nuevo',
          handler: () => {
            // sleep()
            this.dontAskAgain = true;
          }
        }
      ] 
    });

    await alert.present();
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
}
