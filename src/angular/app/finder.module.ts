import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';

import {NzInputModule} from 'ng-zorro-antd/input';
import {NzFlexModule} from 'ng-zorro-antd/flex';
import {NzFormModule} from 'ng-zorro-antd/form';
import {ReactiveFormsModule} from '@angular/forms';
import {NzCheckboxModule} from 'ng-zorro-antd/checkbox';
import {NzCollapseModule} from 'ng-zorro-antd/collapse';
import {FinderComponent} from './finder/finder.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzToolTipModule} from 'ng-zorro-antd/tooltip';
import {NzMessageModule} from 'ng-zorro-antd/message';
import {NzModalModule} from 'ng-zorro-antd/modal';

@NgModule({
  declarations: [
    FinderComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FontAwesomeModule,
    NzToolTipModule,
    NzButtonModule,
    NzInputModule,
    NzCheckboxModule,
    NzFlexModule,
    ReactiveFormsModule,
    NzFormModule,
    NzCollapseModule,
    NzMessageModule,
    NzModalModule,
  ],
  bootstrap: [FinderComponent],
})
export class FinderModule { }
