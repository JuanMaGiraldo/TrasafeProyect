import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { AuthenticationService } from '../../services/authentication.service';
import { Storage } from '@ionic/storage';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  validations_form: FormGroup;
  errorMessage: string = '';

  constructor(

    private navCtrl: NavController,
    private authService: AuthenticationService,
    private formBuilder: FormBuilder,
    private storage: Storage,
    private splashscreen: SplashScreen

  ) {
    this.verifyUser();
  }

  ngOnInit() {
    this.validations_form = this.formBuilder.group({
      email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
      ])),
      password: new FormControl('', Validators.compose([
        Validators.minLength(6),
        Validators.required
      ])),
    });

    this.reloadApp();
  }

  async verifyUser() {
    this.storage.get('uid').then((val) => {
      if (val != null && val != "") {
        this.goToApplication();
      }
    });
  }

  async reloadApp() {
    this.storage.get("reload").then((val) => {
      if (val != null && val != "" && val == "yes") {
        this.splashscreen.show();
        window.location.reload(true);
        this.storage.set("reload", "");
      }
    });
  }

  validation_messages = {
    'email': [
      { type: 'required', message: 'Email es requerido.' },
      { type: 'pattern', message: 'Por favor, ingrese un email válido.' }
    ],
    'password': [
      { type: 'required', message: 'Contraseña requerida.' },
      { type: 'minlength', message: 'La contraseña debe de contener al menos 6 caracteres.' }
    ]
  };


  async loginUser(value) {
    this.authService.loginUser(value)
      .then(res => {
        if (res) {
          this.storage.set('uid', res.user.uid);
          this.goToApplication();
        }
      }, err => {
        this.errorMessage = err.message;
      });
  }

  goToRegisterPage() {
    this.navCtrl.navigateForward('/register');
  }

  goToApplication() {
    this.navCtrl.navigateForward('/loadinfo');
  }

}
