import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfig } from '../config/api.config';
import { BattlemapState, SaveBattlemapResponse } from '../models/battlemap.model';

@Injectable({
  providedIn: 'root',
})
export class BattlemapService {
  private http = inject(HttpClient);

  private get apiUrl(): string {
    return `${ApiConfig.getBaseUrl()}/parties`;
  }

  /**
   * Obtém o estado atual do battlemap por ID da sala
   */
  getBattlemapById(partyId: string): Observable<BattlemapState> {
    return this.http.get<BattlemapState>(`${this.apiUrl}/${partyId}/battlemap`);
  }

  /**
   * Obtém o estado do battlemap pelo código da sala (6 letras)
   */
  getBattlemapByCode(code: string): Observable<BattlemapState> {
    return this.http.get<BattlemapState>(`${this.apiUrl}/code/${code}/battlemap`);
  }

  /**
   * Salva o estado completo do battlemap (Apenas Mestre com JWT)
   */
  saveBattlemap(partyId: string, state: BattlemapState): Observable<SaveBattlemapResponse> {
    return this.http.put<SaveBattlemapResponse>(`${this.apiUrl}/${partyId}/battlemap`, state);
  }
}
