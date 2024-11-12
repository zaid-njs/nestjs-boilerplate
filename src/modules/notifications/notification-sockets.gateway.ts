import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { bgGreen, italic, red } from 'cli-color';
import { Server } from 'socket.io';
import { Socket } from 'socket.io-client';
import { UsersService } from '../users/users.service';

@WebSocketGateway()
export class NotificationSocketsGateway {
  @WebSocketServer() server: Server;
  constructor(private readonly userService: UsersService) {}

  afterInit(_: Server) {
    console.log(bgGreen('NOTIFICATION SOCKET GATEWAY INITIALIZED'));
  }

  // when user joins the app
  @SubscribeMessage('join')
  async handleConnection(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { id: string },
  ) {
    try {
      if (!payload?.id)
        throw new Error(italic(red('Socket Error: Payload is empty')));

      const { socketIds } = await this.userService.findOneHelper({
        _id: payload?.id,
      });

      await this.userService.updateOneHelper(
        { _id: payload.id },
        {
          socketIds: [
            ...socketIds.filter((id) => this.server.sockets.sockets.has(id)),
            client.id,
          ],
          isOnline: true,
        },
      );

      console.log(italic(`User Connected: ${payload.id}`));
    } catch (error) {
      console.log(error.message);
    }
  }

  // when user disconnects with the app
  @SubscribeMessage('disconnecting')
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    try {
      const user = await this.userService.updateOneHelper(
        { socketIds: client.id },
        { $pull: { socketIds: client.id } },
      );
      if (user?.socketIds?.length === 0) {
        user.isOnline = false;
        await user.save();
      }
      if (!!user) console.log(italic(`User Disconnected: ${user?.id}`));
    } catch (error) {
      console.log(error.message);
    }
  }
}
