import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProblemSolvingGatewayService } from './problem-solving.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateProblemDto,
  CreateSubmissionDto,
  RequestHintDto,
  RequestSolutionDto,
} from './dto/problem-solving.dto';
import { InstructorGuard } from './guards/instructor.guard';
import { StudentGuard } from './guards/student.guard';

@ApiTags('Problem Solving')
@ApiBearerAuth()
@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class ProblemSolvingGatewayController {
  constructor(
    private readonly problemSolvingService: ProblemSolvingGatewayService,
  ) {}

  private getUser(req: unknown): { id: string; role?: string } {
    const request = req as { user?: { _id?: unknown; id?: unknown; role?: string } };
    const raw = request.user?._id ?? request.user?.id;
    if (!raw) {
      throw new UnauthorizedException('Authentication required');
    }
    return { id: String(raw), role: request.user?.role };
  }

  @Post('instructor/problems')
  @UseGuards(InstructorGuard)
  @ApiOperation({
    summary: 'Create a new problem (Instructor)',
    description:
      'Creates a programming problem with constraints and test cases. Accessible only by instructors.',
  })
  @ApiBody({ type: CreateProblemDto })
  @ApiResponse({
    status: 201,
    description: 'Problem created successfully.',
    schema: {
      example: {
        _id: '665f7d4a3f0f8d0f42c5b8a1',
        title: 'Two Sum',
        description: 'Find two indices that sum to target.',
        constraints: '2 <= nums.length <= 10^4',
        testCases: [{ input: 'nums=[2,7,11,15], target=9', output: '[0,1]' }],
        createdBy: '665f7aa13f0f8d0f42c5b7f0',
      },
    },
  })
  async createProblem(@Request() req: unknown, @Body() dto: CreateProblemDto) {
    const user = this.getUser(req);
    return firstValueFrom(this.problemSolvingService.createProblem(user.id, dto));
  }

  @Get('instructor/problems')
  @UseGuards(InstructorGuard)
  @ApiOperation({
    summary: 'List problems (Instructor)',
    description: 'Returns all available problems for instructors.',
  })
  @ApiResponse({
    status: 200,
    description: 'Problems retrieved successfully.',
  })
  async listProblemsForInstructor() {
    return firstValueFrom(this.problemSolvingService.listProblems());
  }

  @Get('instructor/problems/:id')
  @UseGuards(InstructorGuard)
  @ApiOperation({
    summary: 'Get problem by id (Instructor)',
    description: 'Returns problem details for a specific problem id.',
  })
  @ApiParam({
    name: 'id',
    description: 'Problem Mongo ObjectId',
    example: '665f7d4a3f0f8d0f42c5b8a1',
  })
  @ApiResponse({
    status: 200,
    description: 'Problem retrieved successfully.',
  })
  async getProblemForInstructor(@Param('id') id: string) {
    return firstValueFrom(this.problemSolvingService.getProblem(id));
  }

  @Delete('instructor/problems/:id')
  @UseGuards(InstructorGuard)
  @ApiOperation({
    summary: 'Delete problem (Instructor)',
    description: 'Deletes a problem by id. Only instructor owner can delete.',
  })
  @ApiParam({
    name: 'id',
    description: 'Problem Mongo ObjectId',
    example: '665f7d4a3f0f8d0f42c5b8a1',
  })
  @ApiResponse({
    status: 200,
    description: 'Problem deleted successfully.',
    schema: { example: { success: true, message: 'Problem deleted successfully' } },
  })
  async deleteProblem(@Request() req: unknown, @Param('id') id: string) {
    const user = this.getUser(req);
    return firstValueFrom(this.problemSolvingService.deleteProblem(user.id, id));
  }

  @Get('student/problems')
  @UseGuards(StudentGuard)
  @ApiOperation({
    summary: 'List problems (Student)',
    description: 'Returns all problems visible to students.',
  })
  @ApiResponse({
    status: 200,
    description: 'Problems retrieved successfully.',
  })
  async listProblemsForStudent() {
    return firstValueFrom(this.problemSolvingService.listProblems());
  }

  @Get('student/problems/:id')
  @UseGuards(StudentGuard)
  @ApiOperation({
    summary: 'Get problem by id (Student)',
    description: 'Returns a single problem details for student solving workflow.',
  })
  @ApiParam({
    name: 'id',
    description: 'Problem Mongo ObjectId',
    example: '665f7d4a3f0f8d0f42c5b8a1',
  })
  @ApiResponse({
    status: 200,
    description: 'Problem retrieved successfully.',
  })
  async getProblemForStudent(@Param('id') id: string) {
    return firstValueFrom(this.problemSolvingService.getProblem(id));
  }

  @Post('student/submissions')
  @UseGuards(StudentGuard)
  @ApiOperation({
    summary: 'Submit solution (Student)',
    description:
      'Submits student code for evaluation. Returns accepted or wrong_answer with optional failed test case.',
  })
  @ApiBody({ type: CreateSubmissionDto })
  @ApiResponse({
    status: 201,
    description: 'Submission evaluated and stored.',
    schema: {
      example: {
        _id: '665f80c53f0f8d0f42c5b941',
        userId: '665f7aa13f0f8d0f42c5b7f0',
        problemId: '665f7d4a3f0f8d0f42c5b8a1',
        language: 'javascript',
        status: 'wrong_answer',
        failedTestCase: { input: 'nums=[3,2,4], target=6', output: '[1,2]' },
      },
    },
  })
  async createSubmission(
    @Request() req: unknown,
    @Body() dto: CreateSubmissionDto,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(this.problemSolvingService.createSubmission(user.id, dto));
  }

  @Post('student/problems/:id/hint')
  @UseGuards(StudentGuard)
  @ApiOperation({
    summary: 'Get AI hint (Student)',
    description:
      'Requests AI hint for a problem. Hint level is managed by backend and capped to 3 hints per user/problem.',
  })
  @ApiParam({
    name: 'id',
    description: 'Problem Mongo ObjectId',
    example: '665f7d4a3f0f8d0f42c5b8a1',
  })
  @ApiBody({ type: RequestHintDto })
  @ApiResponse({
    status: 201,
    description: 'Hint generated successfully.',
    schema: {
      example: {
        _id: '665f82803f0f8d0f42c5b97f',
        userId: '665f7aa13f0f8d0f42c5b7f0',
        problemId: '665f7d4a3f0f8d0f42c5b8a1',
        type: 'hint',
        level: 1,
        response: 'Try using a hash map to store seen values for O(n) lookup.',
      },
    },
  })
  async requestHint(
    @Request() req: unknown,
    @Param('id') id: string,
    @Body() dto: RequestHintDto,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.requestHint(user.id, {
        ...dto,
        problemId: id,
      }),
    );
  }

  @Post('student/problems/:id/solution')
  @UseGuards(StudentGuard)
  @ApiOperation({
    summary: 'Get AI solution (Student)',
    description:
      'Requests AI solution for a problem. Requires at least one failed submission for the user/problem.',
  })
  @ApiParam({
    name: 'id',
    description: 'Problem Mongo ObjectId',
    example: '665f7d4a3f0f8d0f42c5b8a1',
  })
  @ApiBody({ type: RequestSolutionDto })
  @ApiResponse({
    status: 201,
    description: 'Solution generated successfully.',
    schema: {
      example: {
        _id: '665f83b13f0f8d0f42c5b99a',
        userId: '665f7aa13f0f8d0f42c5b7f0',
        problemId: '665f7d4a3f0f8d0f42c5b8a1',
        type: 'solution',
        response:
          'Use a hash map while iterating. For each value, check whether target - value already exists.',
      },
    },
  })
  async requestSolution(
    @Request() req: unknown,
    @Param('id') id: string,
    @Body() dto: RequestSolutionDto,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.requestSolution(user.id, {
        ...dto,
        problemId: id,
      }),
    );
  }
}

