import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, mergeMap, Observable } from 'rxjs';
import {currencies} from './currencies';

export interface ICurencyList {
  base: string,
  rates: {
    [key: string]: number;
  }
}

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  constructor(private _http: HttpClient) {}

  public getCurrencyList(base?: string): Observable<ICurencyList> {
    const baseQuery = base ? `?base=${base}` : null;

    return this._http.get(`https://api.exchangerate.host/latest${baseQuery ?? ''}`).pipe(
      map((response: any)=>{
        return {
          base: response.base,
          rates: response.rates
        }
      }));
  }

  public getLocalCurrency() {
    return this._http.get<{country_code: string}>('http://api.ipapi.com/api/check?fields=country_code&access_key=7a7ba612ca20b02516d47a097bf353b6')
    .pipe(map((response) => response.country_code))
    .pipe(map((countryCode) => currencies[countryCode] ?? 'USD'))
  }
}
