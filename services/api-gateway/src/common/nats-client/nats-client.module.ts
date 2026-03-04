import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import configuration from '../config/configuration';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'NATS_SERVICE',
        useFactory: () => {
          return {
            transport: Transport.NATS,
            options: {
              servers: [configuration().NATS_URL || ''],
            },
          };
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class NatsClientModule { }
