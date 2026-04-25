import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'NATS_OUTBOUND',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => {
          const url =
            config.get<string>('NATS_URL')?.trim() || 'nats://localhost:4222';
          const user = config.get<string>('NATS_USER')?.trim();
          const pass = config.get<string>('NATS_PASSWORD')?.trim();
          return {
            transport: Transport.NATS,
            options: {
              servers: [url],
              ...(user && pass ? { user, pass } : {}),
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class OutboundNatsModule {}
