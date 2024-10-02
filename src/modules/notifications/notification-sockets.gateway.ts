import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { green } from 'cli-color';
import { Server } from 'socket.io';

@WebSocketGateway()
export class NotificationSocketsGateway {
  @WebSocketServer() server: Server;
  constructor() {}

  afterInit(server: Server) {
    console.log(green('NOTIFICATION SOCKET GATEWAY INITIALIZED'));
  }
}
