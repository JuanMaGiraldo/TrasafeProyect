import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { AuthenticationService } from '../../services/authentication.service';
import { FirebaseServiceService } from '../../services/firebase-service.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {

  validations_form: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
 
  validation_messages = {
   'user':[
     { type: 'required', message: 'Usuario es requerido.' },
     { type: 'pattern', message: 'Ingrese un usuario válido.' }
   ],
   'email': [
     { type: 'required', message: 'Email es requerido.' },
     { type: 'pattern', message: 'Ingrese un email válido.' }
   ],
   'password': [
     { type: 'required', message: 'Contraseña requerida.' },
     { type: 'minlength', message: 'La contraseña debe de contener al menos 6 caracteres.' }
   ]
 };
 
  constructor(
    private navCtrl: NavController,
    private authService: AuthenticationService,
    private formBuilder: FormBuilder,
    private firebaseService: FirebaseServiceService
  ) {}
 
  ngOnInit(){
    
    this.validations_form = this.formBuilder.group({
      user: new FormControl('',Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_]+')
      ])),
      email: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
      ])),
      password: new FormControl('', Validators.compose([
        Validators.minLength(6),
        Validators.required
      ])),
    });
  }
 
  tryRegister(value){
    this.authService.registerUser(value)
     .then(res => {
       this.firebaseService.addUser(res.user);
       this.errorMessage = "";
       this.successMessage = "Your account has been created. Please log in.";
     }, err => {
       console.log(err);
       this.errorMessage = err.message;
       this.successMessage = "";
     })
  }
 
  goLoginPage(){
    this.navCtrl.navigateForward('/login');
  }

}
