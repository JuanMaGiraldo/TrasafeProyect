import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class MapService {
  URL_API_GEOCODE =
    "https://maps.googleapis.com/maps/api/geocode/json?address=";

  URL_API_LATLNG = "https://maps.googleapis.com/maps/api/geocode/json?latlng=";

  constructor(private _http: HttpClient) {}

  getCoordsFromAddressApi(address: string): Observable<any> {
    return this._http.get(
      `${this.URL_API_GEOCODE}${address}${environment.maps_api.apiKey}`
    );
  }

  getAddressFromCoordsApi(lat, lng): Observable<any> {
    return this._http.get(
      `${this.URL_API_LATLNG}${lat},${lng}${environment.maps_api.apiKey}`
    );
  }
}
