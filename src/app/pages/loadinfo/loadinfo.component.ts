import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Country, Department, City, Location } from '../../models/country';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'app-loadinfo',
  templateUrl: './loadinfo.component.html',
  styleUrls: ['./loadinfo.component.scss'],
})
export class LoadinfoComponent implements OnInit {

  constructor(
    private af: AngularFireDatabase,
    private storage: Storage,
  ) { }

  ngOnInit() { }

  async getLocationsFirebase() {
    this.af.list("/").valueChanges().subscribe(val => {
      var countryInfo: Country = new Country(val[0], val[1]);
      this.saveDatabase(countryInfo);
    });
  }
  async saveDatabase(countryInfo) {
    await this.storage.set("locationsArray", countryInfo);
  }

}
