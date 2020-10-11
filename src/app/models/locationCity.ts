export class LocationCity {
    private countryName: string = "";
    private departmentName: string = "";
    private cityName: string = "";

    getCountry() {
        return this.countryName;
    }

    getDepartment() {
        return this.departmentName;
    }

    getCity() {
        return this.cityName;
    }

    setCountry(countryName) {
        this.countryName = countryName.trim();
    }

    setDepartment(departmentName) {
        this.departmentName = departmentName.trim();
    }

    setCity(cityName) {
        this.cityName = cityName.trim();
    }

    getStringAddress() {
        return `${this.countryName} ${this.departmentName} ${this.cityName}`;
    }

    isLocationCityDefined() {
        return this.getCountry() && this.getDepartment() && this.getCity();
    }
}