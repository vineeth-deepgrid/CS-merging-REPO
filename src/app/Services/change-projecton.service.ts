import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChangeProjectionService {
  dataEvent = new EventEmitter<any>();
  


  constructor() { }
  sendData(data: any) {
    console.log(data,"check data in service")
    this.dataEvent.emit(data);
    
  }



}