import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Enrollment, EnrollmentSchema } from 'src/schemas/course/enrollment.schema';
import { EnrollService } from './enroll.service';
import { EnrollController } from './enroll.controller';
import { CourseModule } from '../course/course.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
    CourseModule, 
  ],
  controllers: [EnrollController],
  providers: [EnrollService],
  exports: [EnrollService],
})
export class EnrollModule {}
