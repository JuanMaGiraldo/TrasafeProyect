import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirebaseServiceService {

  constructor(public db: AngularFirestore) { }

  addUser(user){
    return new Promise<any>((resolve,reject)=>{
      console.log(user);
        this.db.collection('/users').add({
          name: "usuario",
          email: user.email,
          uid: user.uid
        }).then(
          res => resolve(res),
          err => reject(err)
        )

    })
  }

  readUsers(){
    this.db.collection('/users').valueChanges()
    .subscribe(res => {
      console.log(res);
    })    
  }
}
