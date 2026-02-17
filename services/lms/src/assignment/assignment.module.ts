import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Assignment, AssignmentSchema } from './schema/assignment.schema';
import {
  AssignmentAnswer,
  AssignmentAnswerSchema,
} from './schema/assignment-answer.schema';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assignment.name, schema: AssignmentSchema },
      { name: AssignmentAnswer.name, schema: AssignmentAnswerSchema },
    ]),
  ],
  providers: [AssignmentService],
  controllers: [AssignmentController],
  exports: [AssignmentService],
})
export class AssignmentModule {}
