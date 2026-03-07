import {Route} from '@sora-soft/framework';
import axios from 'axios';

export interface IRequest {
  method: 'post' | 'get',
  url: string;
  body: unknown;
}

export class NetworkHandler extends Route {
  @Route.method
  async request(request: IRequest) {
    const res = await axios.request({
      url: request.url,
      data: request.body,
      method: request.method,
    });

    return res.data;
  }
}
