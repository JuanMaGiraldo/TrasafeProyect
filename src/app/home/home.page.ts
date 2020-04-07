import { Component, ViewChild, ElementRef } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { NativeGeocoder, NativeGeocoderResult, NativeGeocoderOptions } from '@ionic-native/native-geocoder/ngx';
 
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

  private options: NativeGeocoderOptions = {
    useLocale: true,
    maxResults: 5
  }; 

  constructor(
    private geolocation: Geolocation,
    private nativeGeocoder: NativeGeocoder) {
  }
 
 
  ngOnInit() {
    this.loadMap();
      
  }
 
  loadMap() {
    this.geolocation.getCurrentPosition().then((resp) => {
      let latLng = new google.maps.LatLng(resp.coords.latitude, resp.coords.longitude);
      let mapOptions = {
        center: latLng,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }
 
      this.getAddressFromCoords(resp.coords.latitude, resp.coords.longitude);
 
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
 
      this.map.addListener('tilesloaded', () => {
        
        this.getAddressFromCoords(this.map.center.lat(), this.map.center.lng());
        
        if(!this.areIndicatorsLoaded){
          this.areIndicatorsLoaded = true;
          this.loadIndicators();
        }
        
        
      });
 
    }).catch((error) => {
      console.log('Error getting location', error);
    });    
  }

  loadIndicators(){
    this.createIndicator("Colombia Quindio Armenia Institucion educativa nuestra señora el belén",3);
    this.createIndicator("Colombia Quindio Armenia Vetcenter Centro veterinario",2);
    this.createIndicator("Colombia Quindio Armenia Iglesia el belén",1);
    this.createIndicator("Colombia Quindio Armenia el placer",1);
    this.createIndicator("Colombia Quindio Armenia Comedor colegio nuestra señora de belen",4);
    this.createIndicator("Colombia Quindio Armenia Universidad del quindio",5);
    
  }

  getColor(indicator){
    switch (indicator){
      case "1":
        return '../../assets/icon/green-dot.png';
      case "2":
        return '../../assets/icon/blue-dot.png';
      case "3":
        return '../../assets/icon/purple-dot.png';
      case "4":
        return '../../assets/icon/yellow-dot.png';
      case "5":
       return '../../assets/icon/red-dot.png';
      case "user":
       return '../../assets/icon/user.png';
    }
  }
  
  createIndicator(location,indicator){    
    
    this.nativeGeocoder.forwardGeocode(location, this.options)
    .then((result: NativeGeocoderResult[]) =>{
      if( location != null && location != ""){
        this.setMarker(result[0].latitude, result[0].longitude, indicator,"Titulo",location);
      }
    })
    .catch((error: any) => this.address += "Error" + error);
  }

  setMarker(lat,long, indicator = null, title = "", body = ""){

    var marker;
    var myLatLng = null;
    var map = this.map;
    

    // Indicator: 1 - 3: 1: bad, 3: good --- if indicator = "user"

    if(lat != null && long != null && indicator != null && typeof indicator != 'undefined'){
      lat = parseFloat(lat);
      long = parseFloat(long);  
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

      if(body != "" || title != ""){

        var contentCard = '<div id="content">';
        contentCard += ( title ? '<h1 id="firstHeading" class="firstHeading">'+title+'</h1>' : "");
        contentCard += ( body  ? '<div id="bodyContent">'+body+'</div>' : "");
        contentCard += '</div>';
      
        var infowindow = new google.maps.InfoWindow({
          content: contentCard
        });

        var url = this.getColor(indicator+"");
        
        this.address += "url"+url;
        this.address += JSON.stringify(myLatLng);
        this.address += body+"  ";
        this.address += map;

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
        
      })
      .catch((error: any) =>{         
        this.address += "Error " + error;
      });
  }

}
