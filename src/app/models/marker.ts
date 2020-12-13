import { Location } from '../models/country';

export class Marker {
    coords: any;
    location: string;
    theftId: string;
    terrorismId: string;

    constructor(location: Location) {
        this.coords = location.getLatLng();
        this.location = location.location;
        this.theftId = location.theftId;
        this.terrorismId = location.terrorismId;
    }
}