import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { AuthenticationService } from '../../services/authentication.service';
import { NavController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/firestore';

import { Router } from '@angular/router';
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
    private router: Router,    
    private db: AngularFirestore,
    

    ) { 

      this.getUid();
    }

  ngOnInit() {
  }

  async closeSession(){
    await this.storage.set("uid","");
    await this.authenticationService.logoutUser();
    this.navCtrl.navigateForward('/login');
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
    userRef.valueChanges()
    .subscribe(res => {
      if(res && res["ubication"]){
        
        var ubication = JSON.parse(res["ubication"]);
        console.log(ubication,uid);
        var lat = ubication["lat"];
        var long = ubication["lng"];
        var ruta =  "https://www.google.com/maps/search/?api=1&query="+lat+","+long;
        console.log(ruta);
      }
      
    });
  }

  delete(){
    this.storage.set("locationsArray",null);
  }

  
}
