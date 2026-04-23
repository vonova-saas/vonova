import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class StudentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { role?: string };
    }>();

    const role = String(request.user?.role ?? '').toLowerCase();
    const isStudent =
      role === 'student' ||
      role === 'student_user' ||
      role === 'student user' ||
      role === 'STUDENT_USER';

    if (!isStudent) {
      throw new ForbiddenException('Student access required');
    }

    return true;
  }
}
