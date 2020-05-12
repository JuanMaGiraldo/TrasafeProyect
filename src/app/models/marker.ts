export class Marker{
    coords : any;
    location : string;
    theftId : string;
    terrorismId : string;

    constructor(coords, location, theftId = "", terrorismId = ""){
        this.coords = coords;
        this.location = location;
        this.theftId = theftId;
        this.terrorismId = terrorismId;
    }
}