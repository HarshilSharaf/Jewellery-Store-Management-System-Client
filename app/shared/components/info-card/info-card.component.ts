import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-info-card',
  templateUrl: './info-card.component.html',
  styleUrls: ['./info-card.component.scss']
})
export class InfoCardComponent implements OnInit {

  cardTitle!:string
  cardValue!:string
  cardIcon!:string
  cardIconImage:string = ''
  percentageIncrease:number = 0
  monthsString = 'Since '

  @Input() set cardData(data:any){
    this.cardTitle = data.cardTitle
    this.cardValue = data.cardValue
    this.cardIcon = data.cardIcon
    this.cardIconImage= data.cardIconImage
    this.percentageIncrease = data.percentageIncrease
    this.monthsString += data.monthsString
  }
 

  constructor() { }

  ngOnInit(): void {
  }

}
