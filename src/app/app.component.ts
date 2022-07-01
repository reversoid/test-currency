import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { CurrencyService, ICurencyList } from './services/currency.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public currencyForm: FormGroup = new FormGroup({
    firstInput: new FormControl(),
    secondInput: new FormControl(),
    firstSelect: new FormControl(),
    secondSelect: new FormControl(),
  });
  public isLoading: boolean = true;

  ngOnInit() {
    // const inputs = ['firstInput', 'secondInput'];
    // const selects = ['firstSelect', 'secondSelect'];

    // for(let input of inputs) {
      
    // }

    this.currencyForm
      .get('firstInput')
      ?.valueChanges.subscribe((value: number) => {
        const anotherValue = this.getCurrencyValue(value, 2).toFixed(2);
        this.currencyForm.patchValue(
          { secondInput: anotherValue ?? 0 },
          { emitEvent: false, onlySelf: true }
        );
      });

    this.currencyForm
      .get('secondInput')
      ?.valueChanges.subscribe((value: number) => {
        const anotherValue = this.getCurrencyValue(value, 1).toFixed(2);
        this.currencyForm.patchValue(
          { firstInput: anotherValue ?? 0 },
          { emitEvent: false, onlySelf: true }
        );
      });
    this.currencyForm
      .get('firstSelect')
      ?.valueChanges.subscribe((value: string) => {
        this.currentState[0] = value;
        this.currencyForm.patchValue(
          { firstInput: this.currencyForm.get('firstInput')?.value },
          { emitEvent: true, onlySelf: true }
        );
      });

    this.currencyForm
      .get('secondSelect')
      ?.valueChanges.subscribe((value: string) => {
        this.currentState[1] = value;

        this.currencyForm.patchValue(
          { secondInput: this.currencyForm.get('secondInput')?.value },
          { emitEvent: true, onlySelf: true }
        );
      });
  }

  public arrowRotated = false;

  public currencyList: ICurencyList = {
    base: 'EUR',
    rates: {},
  };

  private base = 'EUR';

  public currentState: [string, string] = ['USD', 'RUB'];

  constructor(private _currency: CurrencyService) {
    forkJoin([
      this._currency.getCurrencyList(this.base),
      this._currency.getLocalCurrency(),
    ]).subscribe(([currencyList, localCurrency]) => {
      const predefinedCurrencies = ['USD', 'EUR', 'RUB'];
      
      // fill values
      this.currentState[0] = localCurrency;
      this.currencyList = currencyList;
      this.isLoading = false;

      // try not to repeat currencies for first time
      if (this.currentState[0] == this.currentState[1]) {
        for (let c of predefinedCurrencies) {
          if (this.currentState[0] !== c) {
            this.currentState[1] = c;
            break;
          }
        }
      }
    });
  }

  public getCurrencyValue(value: number, inputIndex: 1 | 2) {
    // m currency1 = m*y/x currency2
    // or
    // n currency1 = n*x/y currency1

    const x = this.currencyList.rates[this.currentState[0]];
    const y = this.currencyList.rates[this.currentState[1]];

    const m = value ?? 0;
    if (inputIndex === 2) return (m * y) / x;
    return (m * x) / y;
  }

  public swtichCurrencies() {
    this.arrowRotated = !this.arrowRotated;

    const temp = this.currentState[0];
    this.currentState[0] = this.currentState[1];
    this.currentState[1] = temp;

    this.currencyForm.patchValue(
      { firstInput: this.currencyForm.get('firstInput')?.value },
      { emitEvent: true, onlySelf: true }
    );
  }
}
