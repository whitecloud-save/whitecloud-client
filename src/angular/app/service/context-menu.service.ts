import {Injectable} from '@angular/core';
import {mainAPI} from '../library/api/main-api';

@Injectable({
  providedIn: 'root',
})
export class ContextMenuService {
  constructor() {
    mainAPI
  }
}
