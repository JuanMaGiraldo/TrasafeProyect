import { Injectable } from '@angular/core';
import { AngularFirestore, validateEventsArray } from '@angular/fire/firestore';
import { Storage } from '@ionic/storage';

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
      console.log(user);
        this.db.collection('/users').add({
          name: "usuario",
          email: user.email,
          uid: user.uid,
          ubication: "",
        }).then(
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

  saveNewUbication(ubication){
    var uid = this.getUser();
    this.db.collection("/users").doc("JrXolQYXQALEGmK1tRcT").update({
      ubication: ubication
    });
  }

  readUsers(){
    this.db.collection('/users').valueChanges()
    .subscribe(res => {
      console.log(res);
    })    
  }
}
