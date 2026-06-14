/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-base-to-string */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
  ListProblemsQueryDto,
  RequestHintDto,
  RequestSolutionDto,
  CreateProblemSheetDto,
  UpdateProblemSheetDto,
} from './dto/problem-solving.dto';
import { InstructorGuard } from './guards/instructor.guard';
import { StudentGuard } from './guards/student.guard';
import { CommunitySocialGatewayService } from '../../app/community/social.gateway.service';
import { CommunitySocketGateway } from '../../community/socket/community.gateway';
import { scheduleNotificationFanOut } from '../../app/community/community-notification.helper';

@ApiTags('Problem Solving')
@ApiBearerAuth()
@Controller('api/v1')
@UseGuards(JwtAuthGuard)
export class ProblemSolvingGatewayController {
  constructor(
    private readonly problemSolvingService: ProblemSolvingGatewayService,
    private readonly social: CommunitySocialGatewayService,
    private readonly sockets: CommunitySocketGateway,
  ) { }

  private getUser(req: unknown): { id: string; role?: string } {
    const request = req as {
      user?: { _id?: unknown; id?: unknown; role?: string };
    };
    const raw = request.user?._id ?? request.user?.id;
    if (!raw) {
      throw new UnauthorizedException('Authentication required');
    }
    return { id: String(raw), role: request.user?.role };
  }

  private sanitizeProblemForStudent(problem: unknown) {
    const raw = (problem ?? {}) as {
      testCases?: Array<{ isHidden?: boolean } & Record<string, unknown>>;
    };
    return {
      ...raw,
      testCases: (raw.testCases ?? []).filter((testCase) => !testCase.isHidden),
    };
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
    return firstValueFrom(
      this.problemSolvingService.createProblem(user.id, dto),
    );
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
  async listProblemsForInstructor(@Request() req: unknown) {
    const user = this.getUser(req);
    // Pass `user.id` so PRIVATE problems are scoped to the owner / enrolled
    // courses inside the LMS `listProblems` filter (PUBLIC stays global).
    return firstValueFrom(
      this.problemSolvingService.listProblems(undefined, user.id),
    );
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
    schema: {
      example: { success: true, message: 'Problem deleted successfully' },
    },
  })
  async deleteProblem(@Request() req: unknown, @Param('id') id: string) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.deleteProblem(user.id, id),
    );
  }

  @Post('problem-solving/sheets')
  @UseGuards(InstructorGuard)
  @ApiOperation({ summary: 'Create a problem sheet (Instructor)' })
  async createProblemSolvingSheet(
    @Request() req: unknown,
    @Body() dto: CreateProblemSheetDto,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(this.problemSolvingService.createSheet(user.id, dto));
  }

  @Get('problem-solving/sheets')
  @UseGuards(InstructorGuard)
  @ApiOperation({ summary: 'List problem sheets (Instructor)' })
  async listProblemSolvingSheets(
    @Request() req: unknown,
    @Query('status') status?: 'draft' | 'published',
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.listSheets(user.id, status),
    );
  }

  @Get('problem-solving/sheets/:sheetId')
  @UseGuards(InstructorGuard)
  @ApiOperation({ summary: 'Get problem sheet by id (Instructor)' })
  async getProblemSolvingSheet(
    @Request() req: unknown,
    @Param('sheetId') sheetId: string,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.getSheet(sheetId, user.id),
    );
  }

  @Patch('problem-solving/sheets/:sheetId')
  @UseGuards(InstructorGuard)
  @ApiOperation({ summary: 'Update problem sheet (Instructor)' })
  async updateProblemSolvingSheet(
    @Request() req: unknown,
    @Param('sheetId') sheetId: string,
    @Body() dto: UpdateProblemSheetDto,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.updateSheet(sheetId, user.id, dto),
    );
  }

  @Delete('problem-solving/sheets/:sheetId')
  @UseGuards(InstructorGuard)
  @ApiOperation({ summary: 'Delete problem sheet (Instructor)' })
  async deleteProblemSolvingSheet(
    @Request() req: unknown,
    @Param('sheetId') sheetId: string,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.deleteSheet(sheetId, user.id),
    );
  }

  @Post('problem-solving/sheets/:sheetId/duplicate')
  @UseGuards(InstructorGuard)
  @ApiOperation({ summary: 'Duplicate problem sheet (Instructor)' })
  async duplicateProblemSolvingSheet(
    @Request() req: unknown,
    @Param('sheetId') sheetId: string,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.duplicateSheet(sheetId, user.id),
    );
  }

  @Patch('problem-solving/sheets/:sheetId/publish')
  @UseGuards(InstructorGuard)
  @ApiOperation({ summary: 'Publish or unpublish problem sheet (Instructor)' })
  async publishProblemSolvingSheet(
    @Request() req: unknown,
    @Param('sheetId') sheetId: string,
    @Body() body: { status?: 'draft' | 'published'; published?: boolean },
  ) {
    const user = this.getUser(req);
    const shouldPublish = body.status
      ? body.status === 'published'
      : body.published !== false;
    const sheet = await firstValueFrom(
      shouldPublish
        ? this.problemSolvingService.publishSheet(sheetId, user.id)
        : this.problemSolvingService.unpublishSheet(sheetId, user.id),
    );
    if (shouldPublish) {
      const courseId =
        (sheet as { courseId?: string })?.courseId ??
        (sheet as { data?: { courseId?: string } })?.data?.courseId;
      const title =
        (sheet as { title?: string })?.title ??
        (sheet as { data?: { title?: string } })?.data?.title ??
        'Problem sheet';
      if (courseId) {
        scheduleNotificationFanOut(this.social, this.sockets, {
          audience: {
            kind: 'courseEnrolled',
            courseId: String(courseId),
            excludeUserIds: [user.id],
          },
          template: {
            actorId: user.id,
            type: 'SHEET_ASSIGNED',
            entityType: 'SHEET',
            entityId: sheetId,
            message: `New problem sheet: ${title}`,
            meta: { courseId: String(courseId), sheetId },
          },
          dedupeEntityId: sheetId,
        });
      }
    }
    return sheet;
  }

  @Post('problem-solving/sheets/:sheetId/problems')
  @UseGuards(InstructorGuard)
  @ApiOperation({
    summary: 'Create a problem inside a sheet (Instructor)',
    description:
      'Creates a problem that is automatically scoped to the sheet. Sets isSheetScoped=true and visibilityScope=SHEET_ONLY.',
  })
  @ApiBody({ type: CreateProblemDto })
  async createProblemInSheet(
    @Request() req: unknown,
    @Param('sheetId') sheetId: string,
    @Body() dto: CreateProblemDto,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.createProblemInSheet(user.id, sheetId, dto),
    );
  }

  @Patch('problem-solving/sheets/:sheetId/problems/:problemId')
  @UseGuards(InstructorGuard)
  @ApiOperation({ summary: 'Update a sheet-scoped problem (Instructor)' })
  async updateSheetProblem(
    @Request() req: unknown,
    @Param('sheetId') sheetId: string,
    @Param('problemId') problemId: string,
    @Body() dto: Partial<CreateProblemDto>,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.updateSheetProblem(
        user.id,
        sheetId,
        problemId,
        dto,
      ),
    );
  }

  @Delete('problem-solving/sheets/:sheetId/problems/:problemId')
  @UseGuards(InstructorGuard)
  @ApiOperation({ summary: 'Delete a sheet-scoped problem (Instructor)' })
  async deleteSheetProblem(
    @Request() req: unknown,
    @Param('sheetId') sheetId: string,
    @Param('problemId') problemId: string,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.deleteSheetProblem(user.id, sheetId, problemId),
    );
  }

  @Get('problem-solving/problems/:problemId')
  @UseGuards(InstructorGuard)
  @ApiOperation({
    summary: 'Get full problem document (Instructor)',
    description:
      'Returns the complete problem for editing or preview. Use sheet GET for metadata-only lists.',
  })
  async getProblemSolvingProblem(
    @Request() req: unknown,
    @Param('problemId') problemId: string,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.getProblem(problemId, user.id),
    );
  }

  @Get('student/problem-sheets')
  @UseGuards(StudentGuard)
  @ApiOperation({ summary: 'List published problem sheets (Student)' })
  async listStudentProblemSheets() {
    return firstValueFrom(
      this.problemSolvingService.listSheets(undefined, 'published'),
    );
  }

  @Get('student/problem-sheets/:id')
  @UseGuards(StudentGuard)
  @ApiOperation({ summary: 'Get published problem sheet (Student)' })
  async getStudentProblemSheet(
    @Request() req: unknown,
    @Param('id') id: string,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(this.problemSolvingService.getSheet(id, user.id));
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
  async listProblemsForStudent(
    @Request() req: unknown,
    @Query() query: ListProblemsQueryDto,
  ) {
    const user = this.getUser(req);
    const problems = (await firstValueFrom(
      this.problemSolvingService.listProblems(query, user.id),
    )) as unknown[];
    return problems.map((problem) => this.sanitizeProblemForStudent(problem));
  }

  @Get('student/solved-problems')
  @UseGuards(StudentGuard)
  @ApiOperation({
    summary: 'Get solved problems (Student)',
    description:
      'Returns a list of problem IDs that the current user has solved.',
  })
  @ApiResponse({
    status: 200,
    description: 'Solved problems retrieved successfully.',
    schema: {
      example: ['665f7d4a3f0f8d0f42c5b8a1', '665f7d4a3f0f8d0f42c5b8a2'],
    },
  })
  async getSolvedProblems(@Request() req: unknown) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.getSolvedProblems(user.id),
    );
  }

  @Get('student/problems/:id')
  @UseGuards(StudentGuard)
  @ApiOperation({
    summary: 'Get problem by id (Student)',
    description:
      'Returns a single problem details for student solving workflow.',
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
  async getProblemForStudent(@Request() req: unknown, @Param('id') id: string) {
    const user = this.getUser(req);
    const problem = await firstValueFrom(
      this.problemSolvingService.getProblem(id, user.id),
    );
    return this.sanitizeProblemForStudent(problem);
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
    return firstValueFrom(
      this.problemSolvingService.createSubmission(user.id, dto),
    );
  }

  @Get('student/submissions/:jobId')
  @UseGuards(StudentGuard)
  @ApiOperation({
    summary: 'Get submission job status (Student)',
    description:
      'Polls async judging status/result for a previously submitted job.',
  })
  async getSubmissionStatus(
    @Request() req: unknown,
    @Param('jobId') jobId: string,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.getSubmissionStatus(user.id, jobId),
    );
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

  @Get('student/problems/:id/hints')
  @UseGuards(StudentGuard)
  @ApiOperation({
    summary: 'View AI hints history (Student)',
    description:
      'Returns backend persisted hint progress for current user and problem (hints list, hintsUsed, solutionUsed).',
  })
  @ApiParam({
    name: 'id',
    description: 'Problem Mongo ObjectId',
    example: '665f7d4a3f0f8d0f42c5b8a1',
  })
  @ApiResponse({
    status: 200,
    description: 'Hints history retrieved successfully.',
  })
  async getHints(@Request() req: unknown, @Param('id') id: string) {
    const user = this.getUser(req);
    return firstValueFrom(this.problemSolvingService.getHints(user.id, id));
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

  @Post('student/problems/:id/solved')
  @UseGuards(StudentGuard)
  @ApiOperation({
    summary: 'Mark problem as solved (Student)',
    description: 'Marks a problem as solved for the current user.',
  })
  @ApiParam({
    name: 'id',
    description: 'Problem Mongo ObjectId',
    example: '665f7d4a3f0f8d0f42c5b8a1',
  })
  @ApiResponse({
    status: 200,
    description: 'Problem marked as solved successfully.',
  })
  async markAsSolved(@Request() req: unknown, @Param('id') id: string) {
    const user = this.getUser(req);
    return firstValueFrom(this.problemSolvingService.markAsSolved(user.id, id));
  }

  @Get('problem-solving/sheets/:sheetId/progress')
  @UseGuards(StudentGuard)
  @ApiOperation({ summary: 'Get sheet progress (Student)' })
  async getSheetProgress(
    @Request() req: unknown,
    @Param('sheetId') sheetId: string,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.getSheetProgress(user.id, sheetId),
    );
  }

  @Patch('problem-solving/sheets/:sheetId/progress')
  @UseGuards(StudentGuard)
  @ApiOperation({ summary: 'Update sheet resume position (Student)' })
  async touchSheetProgress(
    @Request() req: unknown,
    @Param('sheetId') sheetId: string,
    @Body() body: { currentProblemIndex?: number },
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.touchSheetProgress(user.id, sheetId, body),
    );
  }

  @Get('problem-solving/problems/:problemId/progress')
  @UseGuards(StudentGuard)
  @ApiOperation({ summary: 'Get problem progress (Student)' })
  async getProblemProgress(
    @Request() req: unknown,
    @Param('problemId') problemId: string,
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.getProblemProgress(user.id, problemId),
    );
  }

  @Patch('problem-solving/problems/:problemId/progress')
  @UseGuards(StudentGuard)
  @ApiOperation({ summary: 'Update problem progress (Student)' })
  async patchProblemProgress(
    @Request() req: unknown,
    @Param('problemId') problemId: string,
    @Body()
    body: {
      solved?: boolean;
      lastSubmissionStatus?: string;
      attemptsCount?: number;
    },
  ) {
    const user = this.getUser(req);
    return firstValueFrom(
      this.problemSolvingService.patchProblemProgress(user.id, problemId, body),
    );
  }
}
