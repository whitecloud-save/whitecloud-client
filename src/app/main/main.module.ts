import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MainComponent} from './main.component';
import {MainRoutingModule} from './main-routing.module';
import {NzLayoutModule} from 'ng-zorro-antd/layout';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {NzModalModule} from 'ng-zorro-antd/modal';
import {NzUploadModule} from 'ng-zorro-antd/upload';
import {GameFolderSelectorComponent} from './dialog/game-import-dialog/game-folder-selector/game-folder-selector.component';
import {GameImportDialogComponent} from './dialog/game-import-dialog/game-import-dialog.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NzFormModule} from 'ng-zorro-antd/form';
import {NzInputModule} from 'ng-zorro-antd/input';
import {NzSelectModule} from 'ng-zorro-antd/select';
import {NzProgressModule} from 'ng-zorro-antd/progress';
import {GameExeSelectorComponent} from './dialog/game-import-dialog/game-exe-selector/game-exe-selector.component';
import {GameDetailFormComponent} from './dialog/game-import-dialog/game-detail-form/game-detail-form.component';
import {NzToolTipModule} from 'ng-zorro-antd/tooltip';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {ImageSelectorComponent} from './components/image-selector/image-selector.component';
import {NzMenuModule} from 'ng-zorro-antd/menu';
import {NzSegmentedModule} from 'ng-zorro-antd/segmented';
import {GameCoverComponent} from './components/game-cover/game-cover.component';
import {NzImageModule} from 'ng-zorro-antd/image';
import {NzAvatarModule} from 'ng-zorro-antd/avatar';
import {NzFlexModule} from 'ng-zorro-antd/flex';
import {NzTagModule} from 'ng-zorro-antd/tag';
import {NzGridModule} from 'ng-zorro-antd/grid';
import {GameCoverFormComponent} from './dialog/game-import-dialog/game-cover-form/game-cover-form.component';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzPaginationModule} from 'ng-zorro-antd/pagination';
import {NzSpinModule} from 'ng-zorro-antd/spin';
import {GameStateComponent} from './components/game-state/game-state.component';
import {GameComponent} from './pages/game/game.component';
import {GameHomeComponent} from './pages/game/game-home/game-home.component';
import {NzStatisticModule} from 'ng-zorro-antd/statistic';
import {NzCardModule} from 'ng-zorro-antd/card';
import {NzSpaceModule} from 'ng-zorro-antd/space';
import {StartGameButtonComponent} from './components/start-game-button/start-game-button.component';
import {NzDividerModule} from 'ng-zorro-antd/divider';
import {HeaderComponent} from './components/header/header.component';
import {NzCheckboxModule} from 'ng-zorro-antd/checkbox';
import {GameSaveComponent} from './pages/game/game-save/game-save.component';
import {NzTableModule} from 'ng-zorro-antd/table';
import {GameSaveTableComponent} from './components/game-save-table/game-save-table.component';
import {FileSizePipe} from './pipes/file-size.pipe';
import {GameSaveStateComponent} from './components/game-save-state/game-save-state.component';
import {FilterAvailableSavesPipe} from './pipes/filter-available-saves.pipe';
import {SaveTotalSizePipe} from './pipes/save-total-size.pipe';
import {GameTimePipe} from './pipes/game-time.pipe';
import {LastGameTimePipe} from './pipes/last-game-time.pipe';
import {GameSettingComponent} from './pages/game/game-setting/game-setting.component';
import {GameCoverInputComponent} from './components/game-cover-input/game-cover-input.component';
import {GameBasicSettingComponent} from './pages/game/game-setting/game-basic-setting/game-basic-setting.component';
import {GameSaveSettingComponent} from './pages/game/game-setting/game-save-setting/game-save-setting.component';
import {NzSliderModule} from 'ng-zorro-antd/slider';
import {NzInputNumberModule} from 'ng-zorro-antd/input-number';
import {SettingComponent} from './pages/setting/setting.component';
import {BasicSettingComponent} from './pages/setting/basic-setting/basic-setting.component';
import {AdvancedSettingComponent} from './pages/setting/advanced-setting/advanced-setting.component';
import {GameAdvancedSettingComponent} from './pages/game/game-setting/game-advanced-setting/game-advanced-setting.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {MixedCdkDragDropModule} from 'angular-mixed-cdk-drag-drop';
import {UserSettingComponent} from './pages/setting/user-setting/user-setting.component';
import {UserLoginRegisterComponent} from './dialog/user-login-register/user-login-register.component';
import {UserModifyNicknameComponent} from './dialog/user-modify-nickname/user-modify-nickname.component';
import {UserForgetPasswordComponent} from './dialog/user-forget-password/user-forget-password.component';
import {SaveRemarkEditorComponent} from './dialog/save-remark-editor/save-remark-editor.component';
import {SyncRemoteGameDialogComponent} from './dialog/sync-remote-game-dialog/sync-remote-game-dialog.component';
import {VipBenefitDialogComponent} from './dialog/vip-benefit-dialog/vip-benefit-dialog.component';
import {SyncCloudSaveDialogComponent} from './dialog/sync-cloud-save-dialog/sync-cloud-save-dialog.component';
import {ConnectionIndicatorComponent} from './components/connection-indicator/connection-indicator.component';
import {SaveTransferIndicatorComponent} from './components/save-transfer-indicator/save-transfer-indicator.component';
import {GameActivityTimelineComponent} from './components/game-activity-timeline/game-activity-timeline.component';
import {NzTimelineModule} from 'ng-zorro-antd/timeline';
import {NzEmptyModule} from 'ng-zorro-antd/empty';
import {NzTypographyModule} from 'ng-zorro-antd/typography';
import {NzNotificationModule} from 'ng-zorro-antd/notification';
import {FullUpdateDialogComponent} from './dialog/full-update-dialog/full-update-dialog.component';

@NgModule({
  declarations: [
    MainComponent,
    GameImportDialogComponent,
    GameFolderSelectorComponent,
    GameExeSelectorComponent,
    GameDetailFormComponent,
    DashboardComponent,
    ImageSelectorComponent,
    GameCoverComponent,
    GameCoverFormComponent,
    GameStateComponent,
    GameComponent,
    GameHomeComponent,
    StartGameButtonComponent,
    HeaderComponent,
    GameSaveComponent,
    GameSaveTableComponent,
    FileSizePipe,
    GameSaveStateComponent,
    FilterAvailableSavesPipe,
    SaveTotalSizePipe,
    GameTimePipe,
    LastGameTimePipe,
    GameSettingComponent,
    GameCoverInputComponent,
    GameBasicSettingComponent,
    GameSaveSettingComponent,
    SettingComponent,
    BasicSettingComponent,
    AdvancedSettingComponent,
    GameAdvancedSettingComponent,
    UserSettingComponent,
    UserLoginRegisterComponent,
    UserModifyNicknameComponent,
    UserForgetPasswordComponent,
    SaveRemarkEditorComponent,
    SyncRemoteGameDialogComponent,
    VipBenefitDialogComponent,
    SyncCloudSaveDialogComponent,
    ConnectionIndicatorComponent,
    SaveTransferIndicatorComponent,
    GameActivityTimelineComponent,
    FullUpdateDialogComponent,
  ],
  imports: [
    CommonModule,
    MainRoutingModule,
    ReactiveFormsModule,
    NzLayoutModule,
    NzButtonModule,
    FontAwesomeModule,
    NzModalModule,
    NzUploadModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzProgressModule,
    NzToolTipModule,
    NzMenuModule,
    NzSegmentedModule,
    NzImageModule,
    NzAvatarModule,
    NzFlexModule,
    NzTagModule,
    NzGridModule,
    NzIconModule,
    NzPaginationModule,
    NzSpinModule,
    NzStatisticModule,
    NzCardModule,
    NzSpaceModule,
    NzDividerModule,
    NzCheckboxModule,
    NzTableModule,
    NzSliderModule,
    NzInputNumberModule,
    DragDropModule,
    MixedCdkDragDropModule,
    NzTimelineModule,
    NzEmptyModule,
    NzTypographyModule,
    NzNotificationModule,
  ],
})
export class MainModule { }
