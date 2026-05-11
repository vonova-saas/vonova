import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { LessonGatewayService } from './lesson.gateway.service';
import {
  AttachLessonMaterialBodyDto,
  AttachLessonProblemBodyDto,
  AttachLessonQuizBodyDto,
  ReorderLessonMaterialsBodyDto,
  ReorderLessonQuizzesBodyDto,
  ReorderLessonProblemsBodyDto,
} from './dto/lesson-resources.gateway.dto';

@ApiTags('LMS Lesson resources')
@ApiBearerAuth()
@Controller('api/v1/lms/courses/:courseId/lessons/:lessonId')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INSTRUCTOR_USER)
export class LessonResourcesGatewayController {
  constructor(private readonly lessonService: LessonGatewayService) {}

  private owner(req: { user?: Record<string, unknown> }): string {
    const u = req.user ?? {};
    return String(u['_id'] ?? u['id'] ?? u['sub'] ?? '');
  }

  @Post('materials')
  @ApiOperation({ summary: 'Attach library material to lesson' })
  @ApiParam({ name: 'courseId' })
  @ApiParam({ name: 'lessonId' })
  async attachMaterial(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: AttachLessonMaterialBodyDto,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    const data = await firstValueFrom(
      this.lessonService.attachMaterial(courseId, lessonId, this.owner(req), {
        materialId: dto.materialId,
        materialType: dto.materialType,
        visibility: dto.visibility,
      }),
    );
    return data;
  }

  @Delete('materials/:materialId')
  @ApiOperation({ summary: 'Detach material from lesson' })
  async detachMaterial(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Param('materialId') materialId: string,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    return firstValueFrom(
      this.lessonService.detachMaterial(
        courseId,
        lessonId,
        materialId,
        this.owner(req),
      ),
    );
  }

  @Patch('materials/reorder')
  @ApiOperation({ summary: 'Reorder lesson materials' })
  async reorderMaterials(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: ReorderLessonMaterialsBodyDto,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    return firstValueFrom(
      this.lessonService.reorderLessonMaterials(
        courseId,
        lessonId,
        this.owner(req),
        { orderedMaterialIds: dto.orderedMaterialIds },
      ),
    );
  }

  @Post('quizzes')
  @ApiOperation({ summary: 'Attach quiz to lesson' })
  async attachQuiz(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: AttachLessonQuizBodyDto,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    return firstValueFrom(
      this.lessonService.attachQuiz(
        courseId,
        lessonId,
        this.owner(req),
        dto.quizId,
      ),
    );
  }

  @Patch('quizzes/reorder')
  @ApiOperation({ summary: 'Reorder lesson quizzes' })
  async reorderQuizzes(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: ReorderLessonQuizzesBodyDto,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    return firstValueFrom(
      this.lessonService.reorderLessonQuizzes(
        courseId,
        lessonId,
        this.owner(req),
        { orderedQuizIds: dto.orderedQuizIds },
      ),
    );
  }

  @Delete('quizzes/:quizId')
  @ApiOperation({ summary: 'Detach quiz from lesson' })
  async detachQuiz(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Param('quizId') quizId: string,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    return firstValueFrom(
      this.lessonService.detachQuiz(
        courseId,
        lessonId,
        quizId,
        this.owner(req),
      ),
    );
  }

  @Post('problems')
  @ApiOperation({ summary: 'Attach problem-solving problem to lesson' })
  async attachProblem(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: AttachLessonProblemBodyDto,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    return firstValueFrom(
      this.lessonService.attachProblem(
        courseId,
        lessonId,
        this.owner(req),
        dto.problemId,
      ),
    );
  }

  @Patch('problems/reorder')
  @ApiOperation({ summary: 'Reorder lesson problems' })
  async reorderProblems(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Body() dto: ReorderLessonProblemsBodyDto,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    return firstValueFrom(
      this.lessonService.reorderLessonProblems(
        courseId,
        lessonId,
        this.owner(req),
        { orderedProblemIds: dto.orderedProblemIds },
      ),
    );
  }

  @Delete('problems/:problemId')
  @ApiOperation({ summary: 'Detach problem from lesson' })
  async detachProblem(
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
    @Param('problemId') problemId: string,
    @Request() req: { user?: Record<string, unknown> },
  ) {
    return firstValueFrom(
      this.lessonService.detachProblem(
        courseId,
        lessonId,
        problemId,
        this.owner(req),
      ),
    );
  }
}
