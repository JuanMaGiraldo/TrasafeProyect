export class Country{
    country : string;
    departments: Department[];

    constructor(name,array){
        this.country = name;
        this.departments = [];
        
        for(var dept of array){
            this.departments.push(new Department(dept["department"],dept["cities"]));
        }        
    }
}

export class Department{
    department : string;
    cities: City[];
    constructor(name,array){
        this.department = name;
        this.cities = [];
        console.log(array)
        for(var city of array){
            this.cities.push(new City(city["city"],city["locations"]));
        }        
    }
}

export class City{
    city : string;
    locations: Location[];
    constructor(name,array){
        this.city = name;
        this.locations = [];
        for(var location of array){
            this.locations.push(new Location(location["location"], location["theftId"],location["terrorismId"], location["theftRating"],location["terrorismRating"]));
        }        
    }
}


export class Location{
    location : string;
    theftId: string;
    terrorismId: string;
    theftRating: string;
    terrorismRating: string;
    lat: string;
    lng: string;
    constructor(location, theftId,terrorismId, theftRating,terrorismRating){
        this.location    = location;
        this.theftId     = theftId;
        this.terrorismId = terrorismId;
        this.theftRating = theftRating;
        this.terrorismRating = terrorismRating;
    }
    
    loadLatLng(lat, lng){
        this.lat = lat;
        this.lng = lng;
    }
}