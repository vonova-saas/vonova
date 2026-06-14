# Problem Solving Sheets Refactor Documentation

## Overview

This document describes the comprehensive refactoring of the Problem Solving Sheets system to implement a sheet-first workflow, fix server crashes from excessive progress recalculation, and improve overall system performance and user experience.

## Key Changes

### 1. Database Schema Updates

#### Problem Schema (`problem.schema.ts`)

Added three new fields to support sheet-scoped problems:

- **`sheetId`**: `ObjectId | null` - Reference to the ProblemSheet this problem belongs to
- **`isSheetScoped`**: `boolean` - Indicates if the problem is scoped to a specific sheet
- **`visibilityScope`**: `enum ['SHEET_ONLY', 'PUBLIC', 'PRIVATE']` - Controls problem visibility

**Default values for backward compatibility:**
- `sheetId`: `null`
- `isSheetScoped`: `false`
- `visibilityScope`: `'PUBLIC'`

#### New SheetProgressSnapshot Schema (`sheet-progress-snapshot.schema.ts`)

Lightweight snapshot model for incremental progress tracking:

- `studentId`: string (indexed)
- `sheetId`: string (indexed)
- `solvedProblemsCount`: number
- `totalProblems`: number
- `completionPercentage`: number
- `completed`: boolean
- `completedAt`: Date | null
- `completedProblemIds`: string[]
- `lastUpdatedAt`: Date

**Indexes:**
- Unique composite index on `studentId` + `sheetId`
- Index on `studentId` + `completed`
- Index on `sheetId` + `completed`

### 2. Database Indexes

Added indexes to optimize queries:

```typescript
ProblemSchema.index({ sheetId: 1 });
ProblemSchema.index({ isSheetScoped: 1 });
ProblemSchema.index({ visibilityScope: 1 });
ProblemSchema.index({ studentId: 1, sheetId: 1 });
```

### 3. Backend API Changes

#### New Sheet Problem APIs

**POST `/api/v1/problem-solving/sheets/:sheetId/problems`**
- Creates a problem automatically scoped to the sheet
- Sets `isSheetScoped=true` and `visibilityScope="SHEET_ONLY"`
- Problem only visible within the sheet context
- Guard: `InstructorGuard`

**GET `/api/v1/problem-solving/sheets/:sheetId/problems`**
- Returns all problems belonging to the specified sheet
- Only returns problems with matching `sheetId`
- Guard: `InstructorGuard`

#### Updated Problem Service

**`listProblems()`** - Modified to exclude sheet-scoped problems:
```typescript
query.isSheetScoped = { $ne: true };
```

**`createProblemInSheet()`** - New method for creating problems inside sheets:
```typescript
async createProblemInSheet(dto: CreateProblemDto, createdBy: string, sheetId: string) {
  const created = await this.problemModel.create({
    ...dto,
    timeLimit: dto.timeLimit ?? 2000,
    memoryLimit: dto.memoryLimit ?? 128,
    createdBy,
    sheetId,
    isSheetScoped: true,
    visibilityScope: 'SHEET_ONLY',
  });
  return created;
}
```

**`getProblemsBySheet()`** - New method for retrieving sheet problems:
```typescript
async getProblemsBySheet(sheetId: string) {
  return this.problemModel.find({ sheetId }).sort({ createdAt: 1 }).lean();
}
```

#### Incremental Progress Tracking

**`SheetProgressService.incrementalUpdateSheetProgress()`** - New private method:
- Replaces full recalculation with incremental updates
- Only updates counters when a problem is solved for the first time
- Prevents server crashes from excessive computation
- Updates both `SheetProgressSnapshot` and legacy `SheetProgress` for compatibility

**`SheetProgressService.syncSheetsContainingProblem()`** - Updated:
- Now calls `incrementalUpdateSheetProgress()` instead of `recalculateForSheet()`
- Dramatically reduces database load during submissions

### 4. Frontend Changes

#### New Sheet Editor Page

**Route:** `/instructor/[instructorId]/(lms)/problem-solving-management/sheets/[sheetId]/editor`

**Component:** `SheetEditor`
- Displays sheet details (title, description, status, difficulty)
- Embedded problem creator with full form
- Lists all problems in the sheet
- Drag-and-drop ordering support (UI ready, implementation pending)
- Inline edit support (UI ready, implementation pending)
- Preview and save functionality

#### New API Functions

**`createProblemInSheetMutationFn()`** - Creates problem within sheet
**`getProblemsBySheetQueryFn()`** - Retrieves sheet problems

#### Auto-Redirect

**`useCreateInstructorProblemSheetMutationWithRedirect()`** - New hook:
- Automatically redirects to sheet editor after sheet creation
- Implements sheet-first workflow

### 5. Migration Script

**File:** `services/lms/src/lms-ai/problem-solving/migrations/001-add-sheet-scoped-problems.ts`

**Migration steps:**
1. Adds new fields to existing Problem documents with default values
2. Creates indexes for new fields
3. Migrates existing SheetProgress to SheetProgressSnapshot
4. Non-destructive, can be rolled back

**Rollback steps:**
1. Removes new fields from Problem documents
2. Drops SheetProgressSnapshot collection

## API Contracts

### Create Problem in Sheet

**Endpoint:** `POST /api/v1/problem-solving/sheets/:sheetId/problems`

**Request:**
```typescript
{
  title: string;
  description: string;
  constraints: string;
  functionName: string;
  allowUnorderedArrayOutput?: boolean;
  timeLimit?: number;
  memoryLimit?: number;
  testCases: Array<{
    input: unknown;
    expected: unknown;
    ignoreArrayOrder?: boolean;
    isHidden?: boolean;
  }>;
  difficulty: 'easy' | 'medium' | 'hard';
  categories: string[];
}
```

**Response:**
```typescript
{
  _id: string;
  title: string;
  description: string;
  constraints: string;
  functionName: string;
  allowUnorderedArrayOutput: boolean;
  timeLimit: number;
  memoryLimit: number;
  testCases: Array<{
    input: unknown;
    expected: unknown;
    ignoreArrayOrder: boolean;
    isHidden: boolean;
  }>;
  difficulty: 'easy' | 'medium' | 'hard';
  categories: string[];
  createdBy: string;
  sheetId: string;
  isSheetScoped: true;
  visibilityScope: 'SHEET_ONLY';
  createdAt: string;
  updatedAt: string;
}
```

### Get Problems by Sheet

**Endpoint:** `GET /api/v1/problem-solving/sheets/:sheetId/problems`

**Response:**
```typescript
Array<{
  _id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  categories: string[];
  sheetId: string;
  isSheetScoped: true;
  visibilityScope: 'SHEET_ONLY';
  createdAt: string;
  updatedAt: string;
}>
```

## Migration Notes

### Pre-Migration Checklist

1. **Backup database** - Ensure you have a recent backup before running the migration
2. **Test in staging** - Run migration in staging environment first
3. **Monitor performance** - Watch for any performance degradation during migration
4. **Plan rollback** - Have rollback procedure ready in case of issues

### Migration Execution

```bash
# Run migration
npm run migration:run 001-add-sheet-scoped-problems

# Rollback if needed
npm run migration:down 001-add-sheet-scoped-problems
```

### Post-Migration Verification

1. **Verify problem counts** - Ensure all existing problems still exist
2. **Check global listings** - Confirm sheet-scoped problems don't appear in global lists
3. **Test sheet creation** - Create a new sheet and verify auto-redirect
4. **Test problem creation in sheet** - Create problems in sheet editor
5. **Monitor progress tracking** - Verify incremental updates work correctly
6. **Check performance** - Monitor server load during submissions

### Backward Compatibility

**Standalone Problems:**
- Existing problems have `isSheetScoped=false` and `visibilityScope='PUBLIC'`
- Continue to appear in global problem lists
- No changes to existing workflows

**Sheet-Scoped Problems:**
- New problems created in sheets have `isSheetScoped=true` and `visibilityScope='SHEET_ONLY'`
- Only visible within their sheet context
- Don't appear in global problem lists, search, feeds, or recommendations

**Progress Tracking:**
- Legacy `SheetProgress` collection still updated for compatibility
- New `SheetProgressSnapshot` used for incremental updates
- Both collections kept in sync during migration

## Performance Impact

### Improvements

**Progress Recalculation:**
- **Before:** Full recalculation on every submission (O(n) where n = total problems in sheet)
- **After:** Incremental update (O(1) per submission)
- **Impact:** Dramatically reduced database load, prevents server crashes

**Problem Queries:**
- **Before:** All problems queried from global list
- **After:** Sheet-scoped problems excluded from global queries
- **Impact:** Faster global problem listings, reduced payload size

**Database Indexes:**
- New indexes on `sheetId`, `isSheetScoped`, `visibilityScope`
- Composite index on `studentId` + `sheetId` for progress queries
- **Impact:** Optimized query performance for sheet-related operations

### Potential Risks

**Migration Time:**
- Large problem collections may take time to migrate
- Estimated time: ~1-2 seconds per 10,000 problems
- Recommendation: Run during low-traffic period

**Storage Overhead:**
- New `SheetProgressSnapshot` collection adds storage
- Estimated overhead: ~500 bytes per student-sheet pair
- Mitigation: Can implement TTL for old snapshots if needed

**Memory Usage:**
- Incremental tracking maintains snapshot in memory during updates
- Impact: Minimal (single document per update)
- Mitigation: Already optimized with efficient queries

## Technical Debt

### Known Limitations

1. **Drag-and-Drop Ordering:** UI implemented but backend integration pending
2. **Inline Edit:** UI implemented but backend integration pending
3. **Submission Debounce:** Not yet implemented on frontend
4. **Student Progress UI:** Not yet updated for incremental updates
5. **Sheet Analytics:** Not yet implemented

### Future Improvements

1. **Real-time Progress Updates:** Implement WebSocket for live progress updates
2. **Problem Versioning:** Add version history for problems
3. **Sheet Templates:** Create reusable sheet templates
4. **Bulk Operations:** Add bulk create/edit/delete for problems
5. **Advanced Analytics:** Implement detailed sheet analytics dashboard

## Testing Recommendations

### Unit Tests

- Test `ProblemService.createProblemInSheet()` sets correct fields
- Test `ProblemService.listProblems()` excludes sheet-scoped problems
- Test `SheetProgressService.incrementalUpdateSheetProgress()` logic
- Test migration up/down functions

### Integration Tests

- Test sheet creation → auto-redirect flow
- Test problem creation in sheet → isolation from global lists
- Test progress tracking with incremental updates
- Test submission handling with new progress logic

### End-to-End Tests

- Test complete sheet-first workflow
- Test backward compatibility with standalone problems
- Test migration script in staging environment
- Load test submission handling with incremental updates

## Rollback Plan

If issues arise after deployment:

1. **Stop deployment** - Halt any ongoing deployments
2. **Run migration down** - Execute rollback script
3. **Verify data** - Check that data is restored to pre-migration state
4. **Monitor logs** - Review application logs for errors
5. **Communicate** - Notify stakeholders of rollback

## Support

For questions or issues related to this refactoring:
- Review this documentation
- Check migration logs
- Contact the development team
- Monitor performance metrics

## Changelog

### Version 1.0.0 (2026-05-21)

- Added sheetId, isSheetScoped, visibilityScope to Problem schema
- Created SheetProgressSnapshot model for incremental progress tracking
- Added database indexes for optimized queries
- Implemented sheet-scoped problem queries
- Created dedicated sheet problem APIs
- Implemented incremental progress tracking
- Created sheet editor page with embedded problem creator
- Implemented auto-redirect to sheet editor after sheet creation
- Created migration script for backward compatibility
- Added comprehensive documentation
