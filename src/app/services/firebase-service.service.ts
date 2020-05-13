import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Storage } from '@ionic/storage';
//import 'rxjs/add/operator/toPromise';

@Injectable({
  providedIn: 'root'
})
export class FirebaseServiceService {

  constructor(
    
    private db: AngularFirestore,
    private storage: Storage
    
    ) { }

  addUser(user){
    return new Promise<any>((resolve,reject)=>{
        var users = this.db.collection("/users");
        users.doc(user.uid).set({
          ubication:""
        })
        .then(
          res => resolve(res),
          err => reject(err)
        )
    })
  }

  getUser(){
    var val;
    this.storage.get("uid").then( (res) =>{
      val = res;
    });
    if(val){
      return val;
    }
    return "";
  }

  

  saveNewUbication(ubication, uid){
    
    this.db.collection("/users").doc(uid).update({
      ubication: ubication
    });
    return uid;
  }

  readUsers(){
    this.db.collection('/users').valueChanges()
    .subscribe(res => {
      console.log(res);
    })    
  }

  getLocations(country,department,city){
    var arrayLocalities = [];
    var countryRef = this.db.collection("countries");
    countryRef = this.db.collection('/countries', ref => ref.where('country', '>=', country));
    countryRef.get()
    .toPromise()
    .then((querySnapshot) => {      
      querySnapshot.forEach((countryObj) => {
        countryObj.ref.collection("departments").where("department",">=",department).get().then((querySnapshot) => {      
          querySnapshot.forEach(cityObj => {
            cityObj.ref.collection("cities").where("city",">=",city).get().then((querySnapshot) => {      
              querySnapshot.forEach(localityObj => {                
                localityObj.ref.collection("locations").get().then((querySnapshot)=> {                                   
                  querySnapshot.forEach(locality => {
                    arrayLocalities.push(locality.data());                    
                  });
                });
              });      
            });
          });      
        });
      });
    });
    return arrayLocalities;
  }
}
