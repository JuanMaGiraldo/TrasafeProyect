import { Component, ViewChild, ElementRef } from "@angular/core";
import { Geolocation } from "@ionic-native/geolocation/ngx";
import { Marker } from "../../models/marker";
import { AlertController } from "@ionic/angular";
import { FirebaseServiceService } from "../../services/firebase-service.service";
import { AngularFirestore } from "@angular/fire/firestore";
import { AuthenticationService } from "../../services/authentication.service";
import { MapService } from "../../services/map.service";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";
import { Storage } from "@ionic/storage";
import { AngularFireDatabase, listChanges } from "@angular/fire/database";
import { Country, Department, City, Location } from "../../models/country";
import { LocationCity } from "../../models/locationCity";

declare var google;

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
})
export class HomePage {
  @ViewChild("map", { static: false }) mapElement: ElementRef;
  map: any;
  KEY_COUNTRY_DATA = "locationsArray";
  LOCATION_NOT_FINDED = "ZERO_RESULTS";
  OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT";
  error: string = "";
  console: string = "";
  line: any;
  arrayMarkers: Marker[] = [];
  isSharingLocation: boolean;
  lastAlert: Date;
  lastSafe: Date;
  dontAskAgain: boolean;
  srcIndicator: string;
  userTheftZone: string;
  userTerrorismZone: string;
  userActualPosition: any;
  mapOptions: any;
  isTracking: boolean;
  postionSubscription: Subscription;
  trackingUbication: string;
  lastTrackUbication: any = null;
  isShowingMessage: boolean;
  locations: any;
  arrayLocalities: any[];
  uid: string = "";
  idUser: string = "";
  idUserShow: string = "";
  flagUserConnectedWithUser: boolean = false;
  countryInfo: Country = null;
  locationsToUpdate: any;
  searchBox: any;
  shareUser: any = null;
  userMarker: any;
  destinationMarker: any;
  shareUbicationMarker: any;
  loadedLocations: string[] = [];

  constructor(
    private geolocation: Geolocation,
    private alertController: AlertController,
    private firebaseService: FirebaseServiceService,
    private authService: AuthenticationService,
    private db: AngularFirestore,
    private af: AngularFireDatabase,
    private storage: Storage,
    private mapService: MapService
  ) {
    this.mapOptions = {
      zoom: 17,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewContr1ol: false,
      fullscreenControl: false,
    };
    this.isSharingLocation = false;
    this.lastAlert = null;
    this.lastSafe = null;
    this.dontAskAgain = false;
    this.srcIndicator = "";
    this.userActualPosition = null;
    this.trackingUbication = "";
    this.locationsToUpdate = new Array();
    this.getUid();
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.loadMap();
    this.initializeAutocompleteInput();
  }

  loadMap() {
    this.createMap();
    this.loadInitInfoFromUserPosition();
    this.trackUserPosition();
  }

  createMap() {
    this.map = new google.maps.Map(
      this.mapElement.nativeElement,
      this.mapOptions
    );
  }

  initializeAutocompleteInput() {
    var searchBox = new google.maps.places.Autocomplete(
      document.getElementById("pac-input"),
      {
        componentRestrictions: { country: ["CO"] },
        fields: ["address_components", "name"],
      }
    );

    searchBox.addListener("place_changed", () => {
      let place = searchBox.getPlace();
      if (place) {
        let completeAddress = "";
        var addressComponents = place["address_components"];
        for (
          let i = addressComponents.length - 1, cont = 0;
          i >= 0 && cont < 3;
          i--
        ) {
          let name = addressComponents[i]["long_name"];
          if (isNaN(name)) {
            completeAddress += `${name} `;
            cont++;
          }
        }
        this.searchInfoPlace(completeAddress);
      }
    });
  }

  loadInitInfoFromUserPosition() {
    this.geolocation
      .getCurrentPosition()
      .then(({ coords }) => {
        this.userActualPosition = this.createLatLngObj(
          coords.latitude,
          coords.longitude
        );
        this.centerUserMap();
        this.loadIndicatorsFromCoords(this.userActualPosition);
      })
      .catch((error) => {
        this.error = `Error where i am: ${error}`;
      });
  }

  searchInfoPlace(placeToSearch) {
    if (placeToSearch && placeToSearch != "") {
      this.mapService
        .getCoordsFromAddressApi(placeToSearch)
        .subscribe((addressData) => {
          var location = addressData.results[0].geometry.location;
          var latLng = this.createLatLngObj(location.lat, location.lng);
          this.centerMap(latLng);
          this.updateDestinationMarker(latLng);
          this.loadIndicatorsFromCoords(latLng);
        });
    }
  }

  getUserSearchPlace() {
    return this.searchBox
      ? this.searchBox.gm_accessors_.places.Ee.formattedPrediction
      : "";
  }

  centerUserMap() {
    this.centerMap(this.userActualPosition);
  }

  centerShareUser() {
    this.centerMap(this.shareUser);
  }

  centerMap(position) {
    this.map.setCenter(position);
    this.map.setZoom(17);
  }

  trackUserPosition() {
    this.postionSubscription = this.geolocation
      .watchPosition()
      .pipe(filter((p) => p.coords != undefined))
      .subscribe((data) => {
        setTimeout(() => {
          //this.userActualPosition = this.createLatvar GOOGLE_KEY = '&key=AIzaSyAkTrr49hjEGTLdeAMWsun55vLhXs1OWJU';Lng(lat: data.coords.latitude, lng: data.coords.longitude};       //Testing locations
          this.userActualPosition = this.createLatLngObj(
            this.map.center.lat(),
            this.map.center.lng()
          );
          if (this.userHasChangePosition(this.userActualPosition)) {
            this.updateUserMarker();
            this.getNearestLocationToUser();
          }
        });
      });
  }

  confirmId(id) {
    this.db
      .collection("/users", (ref) => ref.where("id", "==", id))
      .valueChanges()
      .subscribe((res) => {
        if (res && res[0] && res[0]["uid"]) {
          if (!this.flagUserConnectedWithUser) {
            this.createAlert("Éxito!", "Conexión éxitosa.");
            this.flagUserConnectedWithUser = true;
          }
          this.getLastUbication(res[0]["uid"]);
        } else {
          this.createAlert(
            "Error",
            "No se pudo encontrar el usuario, ingrese de nuevo el id."
          );
        }
      });
  }

  updateUserMarker() {
    this.deleteLastMarker(this.userMarker);
    var map = this.map;

    var marker = new google.maps.Marker({
      position: this.userActualPosition,
      map: map,
      icon: this.getMarketIcon("user"),
    });

    this.userMarker = marker;
  }

  updateUserShareLocationMarker() {
    this.deleteLastMarker(this.shareUbicationMarker);
    var map = this.map;

    var marker = new google.maps.Marker({
      position: this.shareUser,
      map: map,
      icon: this.getMarketIcon("ubication"),
    });

    this.shareUbicationMarker = marker;
  }

  updateDestinationMarker(latLng) {
    this.deleteLastMarker(this.destinationMarker);
    var map = this.map;

    var marker = new google.maps.Marker({
      position: latLng,
      map: map,
    });

    this.destinationMarker = marker;
  }

  deleteLastMarker(marker) {
    if (marker) {
      marker.setMap(null);
    }
  }

  createLocationMarker(location: Location) {
    var map = this.map;
    var TIME_STOP_ANIMATION = 2000;
    var contentCard = this.createContentCard(location);
    var urlIcon = this.getMarketIcon(location.theftId);

    var marker = new google.maps.Marker({
      position: location.getLatLng(),
      map: map,
      icon: urlIcon,
    });

    var infowindow = new google.maps.InfoWindow({
      content: contentCard,
    });

    marker.addListener("click", function () {
      infowindow.open(map, marker);
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(marker.setAnimation(null), TIME_STOP_ANIMATION);
    });

    if (location.theftId != "") {
      this.createTheftCircle(location, map);
    }

    if (location.terrorismId != "") {
      this.createTerrorismCircle(location, map);
    }
  }

  loadIndicatorsFromCoords({ lat, lng }) {
    this.mapService
      .getAddressFromCoordsApi(lat, lng)
      .subscribe((addressData) => {
        var locationCity = this.getInfoAddressFormCoords(addressData);
        if (
          locationCity.isLocationCityDefined() &&
          !this.loadedLocations.includes(locationCity.getStringAddress())
        ) {
          this.loadCityZones(locationCity);
        }
      });
  }

  getInfoAddressFormCoords(addressData): LocationCity {
    var arrayInfo = this.getResponseAddressFromCoords(addressData);
    var locationCity = new LocationCity();
    locationCity.setCountry(arrayInfo[2]);
    locationCity.setDepartment(arrayInfo[1]);
    locationCity.setCity(arrayInfo[0]);
    return locationCity;
  }

  getResponseAddressFromCoords(addressData) {
    var coords = addressData["results"];
    for (let coord in coords) {
      let addreess = coords[coord];
      if (addreess["address_components"].length == 3) {
        return addreess["formatted_address"].split(",");
      }
    }
  }

  async loadCityZones(locationCity: LocationCity) {
    this.storage.get(this.KEY_COUNTRY_DATA).then((res) => {
      if (res) {
        this.countryInfo = new Country(res.country, res.departments);
        this.findCityToLoad(locationCity);
      } else {
        this.getCountryDataFirebase(locationCity);
      }
    });
  }

  async getCountryDataFirebase(locationCity: LocationCity) {
    this.af
      .list("/")
      .valueChanges()
      .subscribe((val) => {
        this.countryInfo = new Country(val[0], val[1]);
        this.saveCountryData();
        this.findCityToLoad(locationCity);
      });
  }

  findCityToLoad(locationCity: LocationCity) {
    var departments: Department[] = this.countryInfo.departments;
    var departmentToLoad = departments.find((department) =>
      this.compareStrings(department.department, locationCity.getDepartment())
    );
    var cityToLoad = departmentToLoad.cities.find((city) =>
      this.compareStrings(city.city, locationCity.getCity())
    );
    if (cityToLoad) {
      this.loadLocalities(cityToLoad.locations, locationCity);
      this.loadedLocations.push(locationCity.getStringAddress());
    }
  }

  getNearestLocationToUser() {
    var nearMarker = this.getNearestLocation(this.arrayMarkers);
    if (nearMarker) {
      this.createLineBetweenUserMarker(
        nearMarker.coords,
        this.userActualPosition
      );
      this.updateRiskMessages(nearMarker);
      this.showAlertCard(nearMarker);
    }
  }

  getNearestLocation(arrayMarkers) {
    var nearDistance = null;
    var nearMarker = null;

    for (var marker of arrayMarkers) {
      var distanceBetweenUserMarker = this.calculateDistance(
        marker.coords,
        this.userActualPosition
      );
      if (nearDistance == null || nearDistance > distanceBetweenUserMarker) {
        nearDistance = distanceBetweenUserMarker;
        nearMarker = marker;
      }
    }

    return nearMarker;
  }

  showAlertCard(nearMarker) {
    if (
      this.canShowAlert() &&
      nearMarker.theftId == 1 &&
      !this.isSharingLocation &&
      this.askAlertAgain()
    ) {
      this.isShowingMessage = true;
      this.notifyAlert();
    }

    if (
      this.canShowAlert() &&
      nearMarker.theftId != 1 &&
      this.isSharingLocation &&
      this.askSafeAgain()
    ) {
      this.isShowingMessage = true;
      this.notifySafe();
    }
  }

  canShowAlert() {
    return !this.isShowingMessage && !this.dontAskAgain;
  }

  updateRiskMessages(nearMarker) {
    this.resetRiskMessages();

    if (nearMarker.theftId != "") {
      var infoTheft = this.getRiskMessage(nearMarker.theftId, "theft");
      this.userTheftZone = infoTheft[0];
      (<HTMLInputElement>document.getElementById("indicatorTheft")).className =
        infoTheft[1];
      this.displayElement("indicatorTheft", "inline");
    }

    if (nearMarker.terrorismId != "") {
      var infoTerrorism = this.getRiskMessage(
        nearMarker.terrorismId,
        "terrorism"
      );
      this.userTerrorismZone = infoTerrorism[0];
      (<HTMLInputElement>(
        document.getElementById("indicatorTerrorism")
      )).className = infoTerrorism[1];
      this.displayElement("indicatorTerrorism", "inline");
    }
  }

  resetRiskMessages() {
    this.userTerrorismZone = "";
    this.userTheftZone = "";
    this.displayElement("indicatorTheft", "none");
    this.displayElement("indicatorTerrorism", "none");
  }

  createLineBetweenUserMarker(nearMarker, userPosition) {
    var path = [
      { lat: parseFloat(nearMarker.lat), lng: parseFloat(nearMarker.lng) },
      { lat: parseFloat(userPosition.lat), lng: parseFloat(userPosition.lng) },
    ];
    this.createLineBetweenPoints(path);
  }

  async shareUbication() {
    var i = 1;

    if (this.isSharingLocation) {
      this.firebaseService.saveNewUbication(
        JSON.stringify(this.userActualPosition),
        this.uid
      );
    } // The interval only starts after 5 seconds.
    var interval = setInterval(() => {
      if (!this.isSharingLocation || i == 20) {
        clearInterval(interval);
      } else {
        this.firebaseService.saveNewUbication(
          JSON.stringify(this.userActualPosition),
          this.uid
        );
      }
    }, 5000);
  }

  shareLocationClick() {
    this.isSharingLocation = !this.isSharingLocation;
    if (this.isSharingLocation) {
      this.shareUbication();
    }
  }

  saveCountryData() {
    this.storage.set(this.KEY_COUNTRY_DATA, this.countryInfo);
  }

  createLineBetweenPoints(path) {
    var lineSymbol = {
      path: "M 0,-1 0,1",
      strokeOpacity: 1,
      scale: 2,
    };

    if (this.line) {
      this.line.setMap(null);
    }
    var line = new google.maps.Polyline({
      path,
      strokeColor: "#ff1a1a",
      strokeOpacity: 0,
      icons: [
        {
          icon: lineSymbol,
          offset: "0",
          repeat: "20px",
        },
      ],
      map: this.map,
    });
    this.line = line;
  }

  userHasChangePosition(latLng) {
    return (
      this.lastTrackUbication == null ||
      latLng.lat != this.lastTrackUbication["lat"] ||
      latLng.long != this.lastTrackUbication["lng"]
    );
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
    minutes /= 1000 * 60;
    if (minutes >= 5) {
      return true;
    }
    return false;
  }

  async showLastUserShareUbication(ubication) {
    ubication = JSON.parse(ubication);
    if (!this.isNullOrEmpty(ubication)) {
      this.shareUser = this.createLatLngObj(ubication["lat"], ubication["lng"]);
      this.updateUserShareLocationMarker();
    }
  }

  getLastUbication(uid) {
    var userRef = this.db.collection("/users").doc(uid);
    userRef.valueChanges().subscribe((res) => {
      if (res && res["ubication"]) {
        this.showLastUserShareUbication(res["ubication"]);
      }
    });
  }

  getUid() {
    this.storage.get("uid").then((val) => {
      if (val != null && val != "") {
        this.uid = val;
      }
    });
  }

  async loadLocalities(
    locationsToLoad: Location[],
    locationCity: LocationCity
  ) {
    locationsToLoad = locationsToLoad.sort(
      (a, b) => parseInt(b.theftId) - parseInt(a.theftId)
    );

    for (var location of locationsToLoad) {
      if (location && !this.isNullOrEmpty(location.location)) {
        this.createIndicator(location, locationCity);
      }
    }

    setTimeout(() => {
      this.saveCountryData();
    }, 3000);
  }

  createIndicator(location: Location, locationCity: LocationCity) {
    var addressToSearch = `${locationCity.getStringAddress()} ${
      location.location
    }`;

    if (!location.googleCanFindLocation()) {
      return true;
    }

    if (location.isLatLongDefined()) {
      this.createLocationIndicator(location);
      return true;
    }

    this.mapService.getCoordsFromAddressApi(addressToSearch).subscribe(
      (addressData) => {
        if (addressData.status == this.OVER_QUERY_LIMIT) {
          setTimeout(() => {
            this.createIndicator(location, locationCity);
          }, 500);
          return false;
        }

        if (addressData.status == this.LOCATION_NOT_FINDED) {
          location.lat = "none"; // do not search again
          location.lng = "none";
          return true;
        }

        if (addressData && addressData.results[0]) {
          let lat: string = addressData.results[0].geometry.location.lat;
          let lng: string = addressData.results[0].geometry.location.lng;
          location.setLatLng(lat, lng);
          this.createLocationIndicator(location);
        }
      },
      (error) => {
        console.log(error);
      }
    );
    return true;
  }

  createLocationIndicator(location: Location) {
    var newMarker = new Marker(location);
    this.arrayMarkers.push(newMarker);
    this.createLocationMarker(location);
  }

  // Generic methods

  createTerrorismCircle(location: Location, map) {
    new google.maps.Circle({
      strokeColor: this.getColor(location.terrorismId, "terrorism"),
      strokeOpacity: 1,
      strokeWeight: 3,
      fillOpacity: 0,
      map: map,
      center: location.getLatLng(),
      radius: 70,
    });
  }

  createTheftCircle(location: Location, map) {
    new google.maps.Circle({
      strokeColor: "#DAD7D6",
      strokeOpacity: 0.8,
      strokeWeight: 1,
      fillColor: this.getColor(location.theftId, "theft"),
      fillOpacity: 0.35,
      map: map,
      center: location.getLatLng(),
      radius: 70,
    });
  }

  createContentCard(location: Location) {
    var contentCard = '<div id=content">';
    contentCard +=
      '<h1 style = "font-size: 18px; font-family: Cambria; margin-top: 6px">' +
      location.location +
      "</h1>";
    contentCard +=
      '<div id="bodyContent"> <strong>Nivel de riesgo hurto: </strong>' +
      this.getTypeIndex(location.theftId) +
      "</div>";
    contentCard +=
      '<div id="bodyContent"> <strong>Número de hurtos: </strong>' +
      location.theftRating +
      "</div>";
    contentCard +=
      '<div id="bodyContent"> <strong>Nivel de riesgo terrorismo: </strong>' +
      this.getTypeIndex(location.terrorismId) +
      "</div>";
    contentCard +=
      '<div id="bodyContent"> <strong>Número de atentados: </strong>' +
      location.terrorismRating +
      "</div>";
    contentCard += "</div>";
    return contentCard;
  }

  calculateDistance(point1, point2) {
    return Math.sqrt(
      Math.pow(point1.lat - point2.lat, 2) +
        Math.pow(point1.lng - point2.lng, 2)
    );
  }

  createLatLngObj(latArg, lngArg) {
    return { lat: Number(latArg), lng: Number(lngArg) };
  }

  compareStrings(var1, var2) {
    return this.removeAccents(var1) == this.removeAccents(var2);
  }

  removeAccents(str) {
    return str
      .toUpperCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  getTypeIndex(index) {
    return ["Nulo", "Alto", "Medio", "Bajo"][index];
  }

  isNullOrEmpty(val) {
    return val == null || (val !== 0 && val === "");
  }

  displayElement(element, type) {
    (<HTMLInputElement>document.getElementById(element)).style.display = type;
  }

  getMarketIcon(indicator) {
    indicator = String(indicator);
    switch (indicator) {
      case "3":
        return "../../assets/icon/green-dot.png";
      case "2":
        return "../../assets/icon/yellow-dot.png";
      case "1":
        return "../../assets/icon/red-dot.png";
      case "user":
        return "../../assets/icon/man.png";
      case "ubication":
        return "../../assets/icon/share-user.png";
      case "stop-ubication":
        return "../../assets/icon/noshare-user.png";
      default:
        return "../../assets/icon/blue-dot.png";
    }
  }

  getRiskMessage(indicator, type) {
    indicator = String(indicator);
    if (type == "theft") {
      switch (indicator) {
        case "3":
          return ["Riesgo hurto: bajo", "lowTheftRisk"];
        case "2":
          return ["Riesgo hurto: medio", "mediumTheftRisk"];
        case "1":
          return ["Riesgo hurto: alto", "highTheftRisk"];
      }
    } else {
      switch (indicator) {
        case "3":
          return ["Riesgo terrorismo: bajo", "lowTerrorismRisk"];
        case "1":
          return ["Riesgo terrorismo: alto", "highTerrorismRisk"];
      }
    }
  }

  getColor(indicator, key) {
    indicator -= 1;
    return key == "theft"
      ? ["red", "yellow", "green"][indicator]
      : ["black", "", "#8393F1"][indicator];
  }

  createIdUser() {
    (<HTMLInputElement>document.getElementById("button_share_id")).className =
      "hide-element";
    (<HTMLInputElement>document.getElementById("div_id_user")).className =
      "div_id_user";
    this.generateId();
  }

  generateId() {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
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
      header: "Ver ubicacion",
      inputs: [
        {
          name: "id",
          placeholder: "Id del usuario que desea ver.",
        },
      ],
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
        },
        {
          text: "Conectar",
          handler: (data) => {
            this.confirmId(data.id);
          },
        },
      ],
    });
    await alert.present();
  }

  async notifySafe() {
    const alert = await this.alertController.create({
      header: "¡Sugerencia!",
      message:
        "Estás entrando en una zona de bajo riesgo. <br/><br/>¿Deseas continuar compartiendo tu ubicación?",
      buttons: [
        {
          text: "Si",
          cssClass: "primary",
          handler: () => {
            this.lastSafe = new Date();
            this.isShowingMessage = false;
          },
        },
        {
          text: "No",
          handler: () => {
            // sleep()
            this.isShowingMessage = false;
            this.isSharingLocation = false;
          },
        },
        {
          text: "No preguntar de nuevo",
          handler: () => {
            // sleep()
            this.isShowingMessage = false;
            this.dontAskAgain = true;
          },
        },
      ],
    });

    await alert.present();
  }

  async createAlert(title, body) {
    const alert = await this.alertController.create({
      header: title,
      message: body,
      buttons: [
        {
          text: "Aceptar",
          cssClass: "primary",
          handler: () => {},
        },
      ],
    });

    await alert.present();
  }

  async notifyAlert() {
    const alert = await this.alertController.create({
      header: "¡Precaución!",
      message:
        "Estás entrando en una zona riesgosa. <br/><br/>¿Deseas compartir tu ubicación?",
      buttons: [
        {
          text: "Si",
          cssClass: "primary",
          handler: () => {
            this.isSharingLocation = true;
            this.isShowingMessage = false;
            this.shareUbication();
          },
        },
        {
          text: "No",
          handler: () => {
            this.isShowingMessage = false;
            this.lastAlert = new Date();
          },
        },
        {
          text: "No preguntar de nuevo",
          handler: () => {
            // sleep()
            this.dontAskAgain = true;
            this.isShowingMessage = false;
          },
        },
      ],
    });

    await alert.present();
  }
}
