import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class InstructorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { role?: string };
    }>();

    const role = String(request.user?.role ?? '').toLowerCase();
    const isInstructor =
      role === 'instructor' ||
      role === 'instructor_user' ||
      role === 'instructor user' ||
      role === 'INSTRUCTOR_USER';

    if (!isInstructor) {
      throw new ForbiddenException('Instructor access required');
    }

    return true;
  }
}
