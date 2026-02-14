import {ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy} from '@angular/router';

export class GameRouteReuseStrategy implements RouteReuseStrategy {
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    // If we are navigating to the same component, check if we want to reuse it.
    // By default, Angular reuses the component if the route config is the same.
    // We want to force a reload if it's the GameComponent, even if the ID changes.
    // However, the default behavior for *different* params is usually to reuse the component but re-run resolvers/subscriptions.
    // If we want to completely destroy and recreate the component, we can return false here.

    // Check if both routes are using the GameComponent (or have the same route config)
    if (future.routeConfig === curr.routeConfig) {
        // If the route has the 'GamePage' animation data, we assume it's a Game page.
        // We want to prevent reuse so the animation triggers properly on component destruction/creation.
        if (future.data && future.data['animation'] === 'GamePage') {
            // Check if the IDs are different. If they are different, we definitely don't want to reuse.
            // Even if we just return false always for GamePage, it ensures a fresh component instance.
            // But usually, Angular reuses strategy is: (future.routeConfig === curr.routeConfig).
            // So we just need to return false when we want to FORCE recreation.

            // Let's verify if the params are different.
            const futureId = future.params['id'];
            const currId = curr.params['id'];

            if (futureId && currId && futureId !== currId) {
                return false;
            }
        }
    }

    return future.routeConfig === curr.routeConfig;
  }
}
