import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { Country, Department, City, Location } from '../../models/country';
import { Storage } from '@ionic/storage';
import { NavController } from '@ionic/angular';
@Component({
  selector: 'app-load-info',
  templateUrl: './load-info.page.html',
  styleUrls: ['./load-info.page.scss'],
})
export class LoadInfoPage implements OnInit {

  private state: string = ""
  private console:string = ""

  constructor(
    private af : AngularFireDatabase,
    private storage: Storage,
    private navCtrl: NavController
  ) { 
    this.state = "Verificando datos..."
  }

  ngOnInit() {
    this.verifyInfo();
  }

  verifyInfo(){
    var info_loaded = false;
    this.storage.get("locationsArray").then((res) =>{      
            
       if(res != null && res != ""){        
        var countryInfo: Country = res;
        if(countryInfo != null && countryInfo.departments.length == 32){
          info_loaded = true;
          this.goToMap();
        }   
       }

      if(!info_loaded){
        this.getLocationsFirebase();
      }
    });     
  }

  async getLocationsFirebase(){
    this.state = "Descargando los datos de la aplicación..."
    this.af.list("/").valueChanges().subscribe((val) => {
      var countryInfo: Country = new Country(val[0],val[1]);   
      this.saveDatabase(countryInfo);
    },
    (error) =>  this.state = "Error descargando los datos, verifique la conexión a Internet.");
  } 

  async saveDatabase(countryInfo:Country){
    if(countryInfo != null && countryInfo.departments.length == 32){
      await this.storage.set("locationsArray",countryInfo);
      this.goToMap();
    }
    else{
      this.state = "Error descargando los datos, vuelve a abrir la aplicación."
    }    
  }
  
  goToMap(){
    this.navCtrl.navigateRoot('/home');
  }
}