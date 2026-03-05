import {Connector, IRawReqPacket, Route} from '@sora-soft/framework';

export class MessageRoute {
  static callback(handlers: Record<string, Route>): (data: IRawReqPacket<unknown>, session: string | undefined, connector: Connector) => Promise<any> {
    return async (packet, session, connector) => {
      const service = packet.service;
      const handler = handlers[service];

      if (!handler) {
        throw new Error(`Unknown service: ${service}`);
      }

      const routeCallback = Route.callback(handler);
      return routeCallback(packet, session, connector);
    };
  }
}
