import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {MainComponent} from './main.component';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {GameComponent} from './pages/game/game.component';
import {GameHomeComponent} from './pages/game/game-home/game-home.component';
import {GameSaveComponent} from './pages/game/game-save/game-save.component';
import {GameSettingComponent} from './pages/game/game-setting/game-setting.component';
import {SettingComponent} from './pages/setting/setting.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        component: DashboardComponent,
        data: { animation: 'HomePage' },
      },
      {
        path: 'game/:id',
        component: GameComponent,
        data: { animation: 'GamePage' },
        children: [
          {
            path: '',
            redirectTo: 'home',
            pathMatch: 'full',
          },
          {
            path: 'home',
            component: GameHomeComponent,
          },
          {
            path: 'save',
            component: GameSaveComponent,
          },
          {
            path: 'setting',
            component: GameSettingComponent,
          },
        ],
      },
      {
        path: 'setting',
        component: SettingComponent,
        data: { animation: 'SettingPage' },
      },
    ],
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule],
})
export class MainRoutingModule { }
