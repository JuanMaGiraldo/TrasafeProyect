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
}
