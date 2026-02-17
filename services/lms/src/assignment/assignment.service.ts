/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment } from './schema/assignment.schema';
import { AssignmentAnswer } from './schema/assignment-answer.schema';
import {
  CreateAssignmentDto,
  QuestionDto,
  UpdateAssignmentDto,
} from './dto/assignment.dto';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectModel(Assignment.name) private assignmentModel: Model<Assignment>,
    @InjectModel(AssignmentAnswer.name)
    private answerModel: Model<AssignmentAnswer>,
  ) {}

  async createAssignment(dto: CreateAssignmentDto, createdBy?: string | null) {
    const assignment = await this.assignmentModel.create({
      ...dto,
      createdBy: createdBy ? new Types.ObjectId(createdBy) : null,
    });
    return assignment;
  }

  async getAllAssignments() {
    return this.assignmentModel.find();
  }

  async getAssignmentById(id: string) {
    const assignment = await this.assignmentModel.findById(id);
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async updateAssignment(
    id: string,
    dto: UpdateAssignmentDto,
    userId?: string,
  ) {
    const assignment = await this.assignmentModel.findById(id);
    if (!assignment) throw new NotFoundException('Assignment not found');

    // if (userId && assignment.createdBy && assignment.createdBy.toString() !== userId) {
    //   throw new ForbiddenException('You are not allowed to update this assignment');
    // }

    if (dto.title !== undefined) assignment.title = dto.title;
    if (dto.description !== undefined) assignment.description = dto.description;
    if (dto.topic !== undefined) assignment.topic = dto.topic;
    if (dto.noOfQuestions !== undefined)
      assignment.noOfQuestions = dto.noOfQuestions;

    if (dto.questions) {
      dto.questions.forEach((updatedQ: QuestionDto) => {
        const index = assignment.questions.findIndex(
          (q) => q.id === updatedQ.id,
        );
        if (index !== -1) {
          assignment.questions[index] = {
            ...assignment.questions[index],
            ...updatedQ,
          };
        } else {
          assignment.questions.push(updatedQ);
        }
      });
    }

    await assignment.save();
    return assignment;
  }

  async deleteAssignment(id: string, userId?: string) {
    const assignment = await this.assignmentModel.findById(id);
    if (!assignment) throw new NotFoundException('Assignment not found');

    // if (userId && assignment.createdBy && assignment.createdBy.toString() !== userId) {
    //   throw new ForbiddenException('You are not allowed to delete this assignment');
    // }

    await assignment.deleteOne();
    return { message: 'Assignment deleted successfully' };
  }

  async submitAssignmentAnswers(
    assignmentId: string,
    answers: Array<{ questionId: string; selectedOptionId: string }>,
    userId?: string,
  ) {
    const assignment = await this.assignmentModel.findById(assignmentId);
    if (!assignment) throw new NotFoundException('Assignment not found');

    const total = assignment.questions.length;
    let score = 0;
    const formatted: {
      questionId: string;
      selectedOptionId: string;
      correct: boolean;
    }[] = [];

    for (const ans of answers) {
      const q = assignment.questions.find((q) => q.id === ans.questionId);
      if (!q) continue;
      const correct = q.correctOptionId === ans.selectedOptionId;
      if (correct) score++;
      formatted.push({
        questionId: ans.questionId,
        selectedOptionId: ans.selectedOptionId,
        correct,
      });
    }

    const percentage = total ? Math.round((score / total) * 10000) / 100 : 0;

    const attempt = await this.answerModel.create({
      assignment: assignment._id,
      userId: userId ? new Types.ObjectId(userId) : 'temp-user',
      answers: formatted,
      score,
      total,
      percentage,
    });

    return {
      attemptId: attempt.id,
      assignmentId,
      score,
      total,
      percentage,
      answers: formatted,
    };
  }

  async getUserAttempt(attemptId: string, userId?: string) {
    const attempt = await this.answerModel.findById(attemptId);
    if (!attempt) throw new NotFoundException('Attempt not found');

    if (userId && attempt.userId && attempt.userId.toString() !== userId) {
      throw new ForbiddenException('You are not allowed to view this attempt');
    }

    return attempt;
  }

  async getUserAttemptsForAssignment(assignmentId: string, userId?: string) {
    if (userId) {
      return this.answerModel
        .find({ assignment: assignmentId, userId })
        .sort({ createdAt: -1 });
    }
    return this.answerModel
      .find({ assignment: assignmentId })
      .sort({ createdAt: -1 });
  }
}
