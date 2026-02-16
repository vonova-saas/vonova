import { IsInt, Min, IsOptional, IsBoolean } from 'class-validator';


export class UpdateBookProgressDto {
@IsInt()
@Min(0)
lastPage: number;


@IsOptional()
@IsInt()
@Min(0)
timeSpentSec?: number;


@IsOptional()
@IsBoolean()
completed?: boolean;
}