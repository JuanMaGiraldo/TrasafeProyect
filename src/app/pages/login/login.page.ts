import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { NavController } from '@ionic/angular';
import { AuthenticationService } from '../../services/authentication.service';
import { Storage } from '@ionic/storage';
import { FirebaseServiceService } from '../../services/firebase-service.service';
import * as firebase from 'firebase';


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
    private firebaseService: FirebaseServiceService
 
  ) { }
 
  ngOnInit() {
    this.verifyUser();

    this.validations_form = this.formBuilder.group({
      email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
      ])),
      password: new FormControl('', Validators.compose([
        Validators.minLength(5),
        Validators.required
      ])),
    });
  }

  async verifyUser(){
    var user = firebase.auth().currentUser; 
    if (user) {      
      await this.storage.set('uid', user.uid);
      console.log("Firebase logueado "+ user.uid);
      await this.navCtrl.navigateForward('/home');
    }else{
      
    } 
  }
 
 
  validation_messages = {
    'email': [
      { type: 'required', message: 'Email is required.' },
      { type: 'pattern', message: 'Please enter a valid email.' }
    ],
    'password': [
      { type: 'required', message: 'Password is required.' },
      { type: 'minlength', message: 'Password must be at least 5 characters long.' }
    ]
  };
 
 
  loginUser(value){
    this.authService.loginUser(value)
    .then(res => {              
      this.verifyUser();
    }, err => {
      this.errorMessage = err.message;      
    });    
  }
 
  goToRegisterPage(){
    this.navCtrl.navigateForward('/register');
  }

}
