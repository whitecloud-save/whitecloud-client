import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {NzInputModule} from 'ng-zorro-antd/input';
import {NzFlexModule} from 'ng-zorro-antd/flex';
import {NzFormModule} from 'ng-zorro-antd/form';
import {ReactiveFormsModule} from '@angular/forms';
import {NzCheckboxModule} from 'ng-zorro-antd/checkbox';
import {GameGuideComponent} from './game-guide/game-guide.component';

@NgModule({
  declarations: [
    GameGuideComponent,
  ],
  imports: [
    BrowserModule,
    NzInputModule,
    NzCheckboxModule,
    NzFlexModule,
    ReactiveFormsModule,
    NzFormModule,
  ],
  bootstrap: [GameGuideComponent],
})
export class GameGuideModule { }
