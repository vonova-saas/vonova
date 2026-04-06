import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import configuration from '../config/configuration';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'NATS_SERVICE',
        useFactory: () => {
          const raw = configuration().NATS_URL?.trim();
          const servers = [
            raw && raw.length > 0 ? raw : 'nats://localhost:4222',
          ];
          return {
            transport: Transport.NATS,
            options: {
              servers,
              ...(configuration().NATS_USER &&
                configuration().NATS_PASSWORD && {
                  user: configuration().NATS_USER,
                  pass: configuration().NATS_PASSWORD,
                }),
            },
          };
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class NatsClientModule { }
