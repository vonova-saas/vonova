import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { S3Service } from './s3.service';
import { S3Client } from '@aws-sdk/client-s3';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

describe('S3Service', () => {
  let service: S3Service;
  let configService: ConfigService;
  let mockS3Client: jest.Mocked<S3Client>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                'env.awsAccessKeyId': 'test-access-key',
                'env.awsSecretAccessKey': 'test-secret-key',
                'env.awsRegion': 'us-east-1',
                'env.awsS3Bucket': 'test-bucket',
                AWS_ACCESS_KEY_ID: 'test-access-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret-key',
                AWS_REGION: 'us-east-1',
                AWS_S3_BUCKET: 'test-bucket',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    configService = module.get<ConfigService>(ConfigService);
    mockS3Client = (service as any).s3Client;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const fileBuffer = Buffer.from('test content');
      const fileName = 'test.pdf';

      (mockS3Client.send as jest.Mock).mockResolvedValue({});

      const result = await service.uploadFile(fileBuffer, fileName);

      expect(result).toBeDefined();
      expect(result).toContain('pdfs/');
      expect(mockS3Client.send).toHaveBeenCalled();
    });

    it('should upload file to custom folder', async () => {
      const fileBuffer = Buffer.from('test content');
      const fileName = 'test.pdf';

      (mockS3Client.send as jest.Mock).mockResolvedValue({});

      const result = await service.uploadFile(fileBuffer, fileName, 'application/pdf', 'documents');

      expect(result).toBeDefined();
      expect(result).toContain('documents/');
    });

    it('should throw InternalServerErrorException on upload failure', async () => {
      const fileBuffer = Buffer.from('test content');
      const fileName = 'test.pdf';

      (mockS3Client.send as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      await expect(service.uploadFile(fileBuffer, fileName)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getFileUrl', () => {
    it('should return correct S3 URL', () => {
      const s3Key = 'pdfs/test-file.pdf';
      const url = service.getFileUrl(s3Key);

      expect(url).toBeDefined();
      expect(url).toContain('test-bucket');
      expect(url).toContain(s3Key);
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const s3Key = 'pdfs/test-file.pdf';

      (mockS3Client.send as jest.Mock).mockResolvedValue({});

      const result = await service.deleteFile(s3Key);

      expect(result).toBe(true);
      expect(mockS3Client.send).toHaveBeenCalled();
    });

    it('should return false when s3Key is empty', async () => {
      const result = await service.deleteFile('');

      expect(result).toBe(false);
    });

    it('should return false on delete failure', async () => {
      const s3Key = 'pdfs/test-file.pdf';

      (mockS3Client.send as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      const result = await service.deleteFile(s3Key);

      expect(result).toBe(false);
    });
  });

  describe('getBucketName', () => {
    it('should return bucket name', () => {
      const bucketName = service.getBucketName();

      expect(bucketName).toBe('test-bucket');
    });
  });
});

