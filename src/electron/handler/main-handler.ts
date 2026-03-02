import {Route} from '@sora-soft/framework';

export class MainHandler extends Route {
  @Route.method
  async test() {
    console.log('Handler.test called');
    return {
      success: true,
    };
  }
}
