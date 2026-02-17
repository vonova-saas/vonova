/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
  } as Partial<AuthService> as AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register should delegate to AuthService.register', async () => {
    const dto = {
      name: 'Test',
      email: 't@example.com',
      password: '123456',
    } as any;
    (authServiceMock.register as jest.Mock).mockResolvedValueOnce({
      message: 'ok',
    });

    const result = await controller.register(dto);

    expect(service.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ message: 'ok' });
  });

  it('login should delegate to AuthService.login', async () => {
    const dto = {
      email: 't@example.com',
      password: '123456',
      userAgent: 'test',
    } as any;
    (authServiceMock.login as jest.Mock).mockResolvedValueOnce({
      message: 'logged in',
    });

    const result = await controller.login(dto);

    expect(service.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ message: 'logged in' });
  });
});
