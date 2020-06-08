import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { AuthenticationService } from '../../services/authentication.service';
import { NavController } from '@ionic/angular';
import { AlertController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/firestore';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  private uid: string;
  constructor(

    private storage: Storage,
    private authenticationService: AuthenticationService,
    private navCtrl: NavController,
    private iab: InAppBrowser,
    private db: AngularFirestore,
    private alertController: AlertController

    ) { 

      this.getUid();
    }

  ngOnInit() {
  }

  async closeSession(){
    await this.storage.set("uid","");
    await this.storage.set("reload","yes");
    await this.authenticationService.logoutUser();    
    this.navCtrl.navigateForward('/login')
    
  }

  getUid(){
    this.storage.get('uid').then((val) => {
      if(val != null && val != ""){
        this.uid = val;
      }
    });
  }

  showLastUbication(){
    this.getLastUbication(this.uid);
  }

  getLastUbication(uid){
    var userRef = this.db.collection("/users").doc(uid);   
    var subscription = userRef.valueChanges()
    .subscribe(res => {
      if(res && res["ubication"] && res["ubication"] != ""){        
        subscription.unsubscribe();
        var ubication = JSON.parse(res["ubication"]);
        var lat = ubication["lat"];
        var long = ubication["lng"];
        var ruta =  "https://www.google.com/maps/search/?api=1&query="+lat+","+long;
        this.iab.create(ruta,"_system");        
      }
      else{
        this.createAlert("Eror","No se encontró la última ubicación compartida");
      }      
    });
  }

  async createAlert(title,body){
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

  delete(){
    this.storage.set("locationsArray",null);
  }

  
}
