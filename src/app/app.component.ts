import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { forkJoin } from 'rxjs';
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

  private base = 'EUR';

  public currencyList: ICurencyList = {
    base: this.base,
    rates: {},
  };

  public currentState: [string, string] = ['USD', 'RUB'];

  public arrowRotated = false;

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

      // not to repeat currencies when initializing
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

  private serviceVariables = {
    inputs: ['firstInput', 'secondInput'],
    selects: ['firstSelect', 'secondSelect'],
  }

  private _updateInput(i: number) {
    // just emit event for input

    const itsValue = this.currencyForm.get(this.serviceVariables.inputs[i])?.value;
    this.currencyForm.get(this.serviceVariables.inputs[i])?.setValue(itsValue, {
      emitEvent: true,
      onlySelf: true,
    });
  }

  ngOnInit() {
    const clearAllIfEmptyOne = () => {
      for (let [i, input] of this.serviceVariables.inputs.entries()) {
        const formInput = this.currencyForm.get(input);  
        if(formInput?.value === null) {
          console.log(formInput.value, input)
          this.currencyForm.get(this.serviceVariables.inputs[(i+1)%2])?.setValue(null, { emitEvent: false, onlySelf: true });
          return;
        }
      }
    };

    // create subscriptions for inputs
    this.serviceVariables.inputs.forEach((input, i) => {
      this.currencyForm
        .get(input)
        ?.valueChanges.subscribe((value: number | null) => {
          const anotherValue = this.getCurrencyValue(
            value ?? 0,
            i === 0 ? 2 : 1
          ).toFixed(2);
          const anotherInput = this.serviceVariables.inputs[i === 0 ? 1 : 0];

          this.currencyForm
            .get(anotherInput)
            ?.setValue(anotherValue, { emitEvent: false, onlySelf: true });

          clearAllIfEmptyOne();
        });
    });

    // create subscriptions for selects
    this.serviceVariables.selects.forEach((select, i) => {
      this.currencyForm.get(select)?.valueChanges.subscribe((value: string) => {
        this.currentState[i] = value;
        this._updateInput(i);
      });
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

    this._updateInput(0);
  }
}
