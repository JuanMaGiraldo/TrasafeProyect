import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { AuthenticationService } from '../../services/authentication.service';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  constructor(

    private storage: Storage,
    private authenticationService: AuthenticationService,
    private navCtrl: NavController,
    private router: Router

    ) { }

  ngOnInit() {
  }

  async closeSession(){
    await this.storage.set("uid","");
    this.authenticationService.logoutUser();
    this.navCtrl.navigateForward('/login');
  }

  showLastUbication(){
    var obj = {
      flag: true
    };
    this.router.navigate(['/home'],{
      queryParams: obj,
      });
  }

}
