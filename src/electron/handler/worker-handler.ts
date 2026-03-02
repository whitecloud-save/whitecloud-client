import {Route} from '@sora-soft/framework';

export class WorkerHandler extends Route {
  @Route.method
  async test() {
    console.log('Handler.test called');
    return {
      success: true,
    };
  }
}
