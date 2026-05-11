import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { getModelToken } from '@nestjs/mongoose';
import { LessonProgress } from './schema/lesson-progress.schema';
import { Lesson } from '../lesson/schema/lesson.schema';
import { EnrollService } from '../enroll/enroll.service';
import { ForbiddenException } from '@nestjs/common';

describe('ProgressService', () => {
  let service: ProgressService;
  let lessonProgressModel: {
    findOneAndUpdate: jest.Mock;
    find: jest.Mock;
  };
  let lessonModel: { findOne: jest.Mock; countDocuments: jest.Mock };
  let enrollService: {
    isEnrolled: jest.Mock;
    getLessonAccess: jest.Mock;
    touchEnrollmentLastLesson: jest.Mock;
    recalculateEnrollmentProgress: jest.Mock;
    getEnrollmentResumeMeta: jest.Mock;
  };

  beforeEach(async () => {
    lessonProgressModel = {
      findOneAndUpdate: jest.fn().mockResolvedValue({ _id: 'lp1' }),
      find: jest.fn().mockResolvedValue([]),
    };

    lessonModel = {
      findOne: jest.fn().mockResolvedValue({ _id: 'les1', courseId: 'c1' }),
      countDocuments: jest.fn().mockResolvedValue(3),
    };

    enrollService = {
      isEnrolled: jest.fn().mockResolvedValue(true),
      getLessonAccess: jest.fn().mockResolvedValue({ access: true }),
      touchEnrollmentLastLesson: jest.fn().mockResolvedValue(undefined),
      recalculateEnrollmentProgress: jest.fn().mockResolvedValue(undefined),
      getEnrollmentResumeMeta: jest.fn().mockResolvedValue({
        lastLessonId: null,
        lastAccessedAt: null,
        enrollmentProgress: 0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: getModelToken(LessonProgress.name),
          useValue: lessonProgressModel,
        },
        {
          provide: getModelToken(Lesson.name),
          useValue: lessonModel,
        },
        {
          provide: EnrollService,
          useValue: enrollService,
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Valid 24-char hex ObjectId so Types.ObjectId.isValid passes.
  const lessonObjectId = '507f1f77bcf86cd799439011';

  it('markLessonComplete rejects when not enrolled', async () => {
    enrollService.isEnrolled.mockResolvedValueOnce(false);
    await expect(
      service.markLessonComplete('c1', lessonObjectId, 'u1', 'u1', true),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('markLessonComplete upserts progress and recalculates enrollment', async () => {
    await service.markLessonComplete('c1', lessonObjectId, 'u1', 'u1', true, 10);
    expect(lessonProgressModel.findOneAndUpdate).toHaveBeenCalled();
    expect(enrollService.touchEnrollmentLastLesson).toHaveBeenCalledWith(
      'c1',
      'u1',
      lessonObjectId,
    );
    expect(enrollService.recalculateEnrollmentProgress).toHaveBeenCalledWith(
      'c1',
      'u1',
    );
  });

  it('getMyCourseProgress returns zeros when not enrolled', async () => {
    enrollService.isEnrolled.mockResolvedValueOnce(false);
    const p = await service.getMyCourseProgress('c1', 'u1');
    expect(p.completedLessonsCount).toBe(0);
    expect(p.totalLessons).toBe(3);
    expect(p.progressPercentage).toBe(0);
  });
});
