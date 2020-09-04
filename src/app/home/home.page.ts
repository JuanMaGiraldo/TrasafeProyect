import { Component, ViewChild, ElementRef } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
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

declare var google;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  @ViewChild('map', { static: false }) mapElement: ElementRef;
  map: any;
  error: string = "";
  console: string = "";
  marker: any;
  line: any;
  areIndicatorsLoaded: boolean = false;
  arrayMarkers: Marker[] = [];
  isSharingLocation: boolean;
  lastAlert: Date;
  lastSafe: Date;
  dontAskAgain: boolean;
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
  arrayLocalities: any[];
  localitiesLoaded: string[];
  uid: string = "";
  markerShareUbication: any = null;
  idUser: string = "";
  idUserShow: string = "";
  flagExit: boolean = false;
  countryInfo: Country = null;
  locationsToUpdate: any;
  searchBox: any;

  constructor(

    private geolocation: Geolocation,
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
      streetViewContr1ol: false,
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
    this.locationsToUpdate = new Array();
    this.getUid();
  }

  ngOnInit() { }

  ngAfterViewInit() {
    this.loadMap();
  }

  loadMap() {
    this.map = new google.maps.Map(this.mapElement.nativeElement, this.mapOptions);
    this.initAutocomplete();
    this.whereIAm();
    this.startTracking();
  }

  initAutocomplete() {
    var input = document.getElementById('pac-input');
    this.searchBox = new google.maps.places.SearchBox(input);
  }

  whereIAm() {
    this.geolocation.getCurrentPosition()
      .then(({ coords }) => {
        this.actualUbication = { lat: coords.latitude, lng: coords.longitude };
        this.centerMap();
        this.loadIndicatorsFromCoords(coords.latitude, coords.longitude);
      })
      .catch((error) => {
        this.error = `Error where i am: ${error}`;
      });
  }

  getUserSearchPlace() {
    return (this.searchBox ? this.searchBox.gm_accessors_.places.oe.formattedPrediction : "");
  }

  searchInfoPlace() {
    var placeToSearch = this.getUserSearchPlace();
    if (placeToSearch) {
      this.getGeoCodefromGoogleAPI(placeToSearch).subscribe(addressData => {
        var location = addressData.results[0].geometry.location;
        let lat: Number = Number(location.lat);
        let long: Number = Number(location.lng);
        this.map.setCenter({ lat: lat, lng: long });
        this.map.setZoom(17);
        this.loadIndicatorsFromCoords(lat, long);
      });
    }
  }

  centerMap() {
    this.map.setCenter(this.actualUbication);
    this.map.setZoom(17);
  }

  startTracking() {
    this.postionSubscription = this.geolocation.watchPosition()
      .pipe(
        filter(p => p.coords != undefined)
      )
      .subscribe(data => {
        setTimeout(() => {
          //this.actualUbication = {lat: data.coords.latitude, lng: data.coords.longitude};       //Testing locations 
          this.actualUbication = { lat: this.map.center.lat(), lng: this.map.center.lng() }
          this.setUserMarker();
          this.getNearestLocation();
        });
      });
  }

  confirmId(id) {
    this.db.collection("/users", ref => ref.where('id', '==', id)).valueChanges().subscribe(res => {
      if (res && res[0] && res[0]["uid"]) {
        if (!this.flagExit) {
          this.createAlert("Éxito!", "Conexión éxitosa.");
          this.flagExit = true;
        }
        this.getLastUbication(res[0]["uid"]);
      } else {
        this.createAlert("Error", "No se pudo encontrar el usuario, ingrese de nuevo el id.");
      }
    });
  }

  async loadLocalities(dataset: Location[], query, i, j) {
    var k = 0;
    for (let location of dataset) {
      this.createIndicator(query, location, i, j, k);
      k++;
    }
    setTimeout(() => {
      this.saveLocations();
    }, 10000);

  }

  saveLocations() {
    this.storage.set("locationsArray", this.countryInfo);
  }

  createIndicator(query, location: Location, i, j, k) {
    if (query != null && query != "" && location != null && location.location != "") {
      query += " " + location.location;
      if (!this.isNullOrEmpty(location.lat) && !this.isNullOrEmpty(location.lng)) {
        let lat: string = location.lat;
        let long: string = location.lng;
        var marker = new Marker({ lat: lat, lng: long }, location.location, location.theftId, location.terrorismId);
        this.arrayMarkers.push(marker);
        this.createMarker(lat, long, location.theftId, location.terrorismId, location.theftRating, location.terrorismRating, location.location, "body");
      } else {
        this.getGeoCodefromGoogleAPI(query).subscribe(addressData => {
          if (addressData && addressData.results[0]) {
            let lat: string = addressData.results[0].geometry.location.lat;
            let long: string = addressData.results[0].geometry.location.lng;
            var marker = new Marker({ lat: lat, lng: long }, location.location, location.theftId, location.terrorismId);
            if (!this.isNullOrEmpty(i) && !this.isNullOrEmpty(j) && !this.isNullOrEmpty(k) && !this.isNullOrEmpty(lat) && !this.isNullOrEmpty(long)) {
              this.countryInfo.departments[i].cities[j].locations[k].lat = lat;
              this.countryInfo.departments[i].cities[j].locations[k].lng = long;
            }
            this.arrayMarkers.push(marker);
            this.createMarker(lat, long, location.theftId, location.terrorismId, location.theftRating, location.terrorismRating, location.location, "body");
          }
        });
      }
    }
  }

  getGeoCodefromGoogleAPI(address: string): Observable<any> {
    return this._http.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + address + "&key=AIzaSyAkTrr49hjEGTLdeAMWsun55vLhXs1OWJU");
  }

  createMarker(lat, long, theftId = "", terrorismId = "", theftRating = "", terrorismRating = "", title = "", body = "") {
    var marker;
    var myLatLng = null;
    var map = this.map;

    if (lat != null && long != null && theftId != null && typeof theftId != 'undefined') {
      myLatLng = { lat: Number(lat), lng: Number(long) };
      if (theftId == "ubication") {
        if (this.markerShareUbication) {
          this.markerShareUbication.setMap(null);
        }
        marker = new google.maps.Marker({
          position: myLatLng,
          map: map,
          icon: this.getIcon("ubication")
        });
        this.markerShareUbication = marker;
      }
      else if (theftId == "user") {
        if (this.lastTrackUbication != null && lat == this.lastTrackUbication["lat"] && long == this.lastTrackUbication["lng"]) {
          return;
        }
        if (this.marker) {
          this.marker.setMap(null);
        }
        this.lastTrackUbication = myLatLng;

        marker = new google.maps.Marker({
          position: myLatLng,
          map: map
        });

        this.marker = marker;

      } else {

        if (body != "" && title != "") {

          var contentCard = '<div id="content">';
          contentCard += (title ? '<h1 style = "font-size: 18px; font-family: Cambria; margin-top: 6px">' + title + '</h1>' : "");
          contentCard += (body ? '<div id="bodyContent"> <strong>Nivel de riesgo hurto: </strong>' + this.getTypeIndex(theftId) + '</div>' : "");
          contentCard += (body ? '<div id="bodyContent"> <strong>Número de hurtos: </strong>' + theftRating + '</div>' : "");
          contentCard += (body ? '<div id="bodyContent"> <strong>Nivel de riesgo terrorismo: </strong>' + this.getTypeIndex(terrorismId) + '</div>' : "");
          contentCard += (body ? '<div id="bodyContent"> <strong>Número de atentados: </strong>' + terrorismRating + '</div>' : "");
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

          marker.addListener('click', function () {
            infowindow.open(map, marker);
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function () {
              marker.setAnimation(null);
            }, 2000);
          });
          if (theftId != "") {
            new google.maps.Circle({
              strokeColor: '#DAD7D6',
              strokeOpacity: 0.8,
              strokeWeight: 1,
              fillColor: this.getColor(theftId, "theft"),
              fillOpacity: 0.35,
              map: map,
              center: myLatLng,
              radius: 70
            });
          }

          if (terrorismId != "") {
            new google.maps.Circle({
              strokeColor: this.getColor(terrorismId, "terrorism"),
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

  loadIndicatorsFromCoords(lattitude, longitude) {
    this.getAddresFromCoordsApi(lattitude, longitude).subscribe(addressData => {
      var coords = addressData["results"];
      var info = (coords[coords.length - 3])["formatted_address"].split(",");
      var locationToLoad = {
        country: info[2],
        department: info[1],
        city: info[0],
        query: `${info[2]} ${info[1]} ${info[0]}`
      }
      if (locationToLoad.country && locationToLoad.department && locationToLoad.city && !this.localitiesLoaded.includes(locationToLoad.query)) {
        this.loadIndicators(locationToLoad);
      }
    });
  }

  loadIndicators(locationToLoad) {
    this.localitiesLoaded.push(locationToLoad.query);
    this.getLocations(locationToLoad);
  }

  getAddresFromCoordsApi(lat, lng): Observable<any> {
    return this._http.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyDzQIvZVyTi7pfm2sIg4u81vmqGx4SBF3c`);
  }

  getNearestLocation() {
    var nearDistance = null;
    var nearMarker = null;
    var userLat = this.actualUbication["lat"];
    var userLong = this.actualUbication["lng"];

    for (var marker of this.arrayMarkers) {
      var coord = marker.coords;
      var distance = Math.sqrt(Math.pow(coord.lat - userLat, 2) + Math.pow(coord.lng - userLong, 2));
      if (nearDistance == null || nearDistance > distance) {
        nearDistance = distance;
        nearMarker = marker;
      }
    }
    if (nearMarker == null) {
      return;
    }

    var path = [
      { lat: parseFloat(nearMarker.coords.lat), lng: parseFloat(nearMarker.coords.lng) },
      { lat: parseFloat(userLat), lng: parseFloat(userLong) }
    ];

    this.createLineBetweenPoints(path);
    this.userTerrorismZone = "";
    this.userTheftZone = "";
    this.displayElement("indicatorTheft", "none");
    this.displayElement("indicatorTerrorism", "none");
    var infoToShow = 0;

    if (nearMarker.theftId != "") {
      var infoTheft = this.getMessage(nearMarker.theftId, "theft");
      this.userTheftZone = infoTheft[0];
      (<HTMLInputElement>document.getElementById("indicatorTheft")).className = infoTheft[1];
      infoToShow += 1;
      this.displayElement("indicatorTheft", "inline");
    }

    if (nearMarker.terrorismId != "") {
      var infoTerrorism = this.getMessage(nearMarker.terrorismId, "terrorism");
      this.userTerrorismZone = infoTerrorism[0];
      (<HTMLInputElement>document.getElementById("indicatorTerrorism")).className = infoTerrorism[1];
      infoToShow += 1;
      this.displayElement("indicatorTerrorism", "inline");
    }

    (<HTMLInputElement>document.getElementById("divisor")).style.display = (infoToShow == 2 ? "inline" : "none");

    if (!this.isShowingMessage && !this.dontAskAgain && nearMarker.theftId == 1 && !this.isSharingLocation && this.askAlertAgain()) {
      this.isShowingMessage = true;
      this.notifyAlert();
    }

    if (!this.isShowingMessage && !this.dontAskAgain && nearMarker.theftId != 1 && this.isSharingLocation && this.askSafeAgain()) {
      this.isShowingMessage = true;
      this.notifySafe();
    }
  }

  displayElement(element, type) {
    (<HTMLInputElement>document.getElementById(element)).style.display = type;
  }

  async shareUbication() {

    var i = 1;
    if (this.isSharingLocation) {
      this.firebaseService.saveNewUbication(JSON.stringify(this.actualUbication), this.uid);
    } // The interval only starts after 5 seconds.
    var interval = setInterval(() => {
      if (!this.isSharingLocation || i == 20) {
        clearInterval(interval);
      }
      else {
        this.firebaseService.saveNewUbication(JSON.stringify(this.actualUbication), this.uid);
      }
    }, 5000);
  }

  shareLocationClick() {
    this.isSharingLocation = !this.isSharingLocation;
    if (this.isSharingLocation) {
      this.shareUbication();
    }
  }


  createLineBetweenPoints(path) {
    var lineSymbol = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      scale: 2
    };

    if (this.line) {
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

  askAlertAgain() {
    return this.compareDates(this.lastAlert);
  }

  askSafeAgain() {
    return this.compareDates(this.lastSafe);
  }

  compareDates(date) {
    if (date == null) {
      return true;
    }
    var actualDate = new Date();
    var minutes = actualDate.getTime() - date.getTime();
    minutes /= (1000 * 60);
    if (minutes >= 5) {
      return true;
    }
    return false;
  }


  getIcon(indicator) {
    switch (indicator) {
      case "3":
        return '../../assets/icon/green-dot.png';
      case "2":
        return '../../assets/icon/yellow-dot.png';
      case "1":
        return '../../assets/icon/red-dot.png';
      case "user":
        return '../../assets/icon/user.png';
      case "ubication":
        return '../../assets/icon/man.png';
      default:
        return '../../assets/icon/blue-dot.png';
    }
  }

  getColor(indicator, key) {
    indicator -= 1;
    return (key == "theft" ? ['red', 'yellow', 'green'][indicator] : ['black', '', '#8393F1'][indicator]);
  }

  async showLastUbication(ubication) {
    ubication = JSON.parse(ubication);
    if (ubication != null && ubication != "") {
      this.createMarker(ubication["lat"], ubication["lng"], "ubication");
    }
  }

  getLastUbication(uid) {
    var userRef = this.db.collection("/users").doc(uid);
    userRef.valueChanges()
      .subscribe(res => {
        if (res && res["ubication"]) {
          this.showLastUbication(res["ubication"]);
        }
      });
  }

  getMessage(indicator, type) {
    indicator = String(indicator);
    if (type == "theft") {
      switch (indicator) {
        case "3":
          return ['Riesgo hurto: bajo', 'lowTheftRisk'];
        case "2":
          return ['Riesgo hurto: medio', 'mediumTheftRisk'];
        case "1":
          return ['Riesgo hurto: alto', 'highTheftRisk'];
      }
    } else {
      switch (indicator) {
        case "3":
          return ['Riesgo terrorismo: bajo', 'lowTerrorismRisk'];
        case "1":
          return ['Riesgo terrorismo: alto', 'highTerrorismRisk'];
      }
    }
  }

  setUserMarker() {
    this.createMarker(this.actualUbication.lat, this.actualUbication.lng, "user");
  }

  getUid() {
    this.storage.get('uid').then((val) => {
      if (val != null && val != "") {
        this.uid = val;
        this.generateId();
      }
    });
  }

  async getLocationsFirebase(country, department, city) {
    this.af.list("/").valueChanges().subscribe(val => {
      var countryInfo: Country = new Country(val[0], val[1]);
      this.storage.set("locationsArray", countryInfo);
      this.countryInfo = countryInfo;
      this.getLocationsInfo(department, city);
    });
  }

  getLocations({ country, department, city }) {

    this.storage.get("locationsArray").then((res) => {
      if (res != null && res != "") {
        this.countryInfo = res;
        this.getLocationsInfo(department, city);
      } else {
        this.getLocationsFirebase(country, department, city);
      }
    });
  }

  getLocationsInfo(departmentQuery, cityQuery) {

    var departments: Department[] = this.countryInfo.departments;
    var i = 0, j = 0
    for (var department of departments) {
      if (this.compareStrings(department.department, departmentQuery)) {
        var cities: City[] = department.cities;
        for (var city of cities) {
          if (this.compareStrings(city.city, cityQuery)) {
            this.loadLocalities(city.locations, this.countryInfo.country + " " + departmentQuery + " " + cityQuery, i, j);
            return;
          }
          j++;
        }
      }
      i++;
    }
  }

  // Generic methods

  compareStrings(var1, var2) { return this.removeAccents(var1) == this.removeAccents(var2) }

  removeAccents(str) { return str.toUpperCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") }

  getTypeIndex(index) { return ['Nulo', 'Alto', 'Medio', 'Bajo'][index]; }

  isNullOrEmpty(val) { return (val == null || (val !== 0 && val === "")); }

  generateId() {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    this.idUser = result;
    this.idUserShow = "Tú id: " + result;
    this.firebaseService.saveNewId(result, this.uid);
  }

  // Alert interfaces methods

  async showInputIdUser() {
    const alert = await this.alertController.create({
      header: 'Ver ubicacion',
      inputs: [
        {
          name: 'id',
          placeholder: 'Id del usuario que desea ver.'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Conectar',
          handler: data => {
            this.confirmId(data.id);
          }
        }
      ]
    });
    await alert.present();
  }

  async notifySafe() {
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

  async createAlert(title, body) {
    const alert = await this.alertController.create({
      header: title,
      message: body,
      buttons: [
        {
          text: 'Aceptar',
          cssClass: 'primary',
          handler: () => {
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
}