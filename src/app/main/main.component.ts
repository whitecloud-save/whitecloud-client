import {Component, AfterViewInit} from '@angular/core';
import {DialogService} from '../service/dialog.service';
import {IconService} from '../service/icon.service';
import {GameService} from '../service/game.service';
import {MainNavService} from '../service/main-nav.service';
import {trigger, transition, style, animate, query} from '@angular/animations';
import {RouterOutlet} from '@angular/router';
import {Router} from '@angular/router';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  animations: [
    trigger('fadeAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0 }),
          animate('300ms ease-in', style({ opacity: 1 }))
        ], { optional: true })
      ])
    ])
  ]
})
export class MainComponent implements AfterViewInit {
  routeAnimation: string = '';

  constructor(
    public dialogService: DialogService,
    public iconService: IconService,
    public gameService: GameService,
    public mainNavService: MainNavService,
    private router: Router,
  ) {}

  ngAfterViewInit(): void {
    this.updateRouteAnimation();
    this.router.events.subscribe(() => {
      this.updateRouteAnimation();
    });
  }

  private updateRouteAnimation() {
    const outlet = this.getRouterOutlet();
    if (!outlet || !outlet.isActivated) {
      this.routeAnimation = '';
      return;
    }
    const animation = outlet.activatedRouteData?.['animation'];
    const gameId = outlet.activatedRoute?.snapshot?.params?.['id'];
    if (animation === 'GamePage' && gameId) {
      this.routeAnimation = `${animation}-${gameId}`;
    } else {
      this.routeAnimation = animation || '';
    }
  }

  private getRouterOutlet(): RouterOutlet | null {
    const outlets = document.querySelectorAll('router-outlet');
    if (outlets.length > 0) {
      return outlets[0] as any;
    }
    return null;
  }

  prepareRoute(outlet: RouterOutlet) {
    if (!outlet || !outlet.isActivated) {
      return '';
    }
    const animation = outlet.activatedRouteData?.['animation'];
    const gameId = outlet.activatedRoute?.snapshot?.params?.['id'];
    if (animation === 'GamePage' && gameId) {
      return `${animation}-${gameId}`;
    }
    return animation;
  }
}
