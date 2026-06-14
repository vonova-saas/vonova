# Problem Solving Sheets Refactor - Testing Guide

## Overview

This guide provides comprehensive testing instructions for the Problem Solving Sheets refactoring. It covers unit tests, integration tests, and end-to-end tests to ensure the new features work correctly and backward compatibility is maintained.

## Pre-Testing Checklist

- [ ] Database backup created
- [ ] Migration script tested in staging environment
- [ ] All lint errors resolved
- [ ] Code reviewed by team
- [ ] Test environment prepared
- [ ] Test data seeded

## Unit Tests

### Backend Tests

#### Problem Service Tests

**Test: `createProblemInSheet()` sets correct fields**
```typescript
describe('ProblemService.createProblemInSheet', () => {
  it('should set sheetId, isSheetScoped=true, and visibilityScope=SHEET_ONLY', async () => {
    const dto = createMockProblemDto();
    const sheetId = 'sheet123';
    const createdBy = 'user123';

    const result = await problemService.createProblemInSheet(dto, createdBy, sheetId);

    expect(result.sheetId).toBe(sheetId);
    expect(result.isSheetScoped).toBe(true);
    expect(result.visibilityScope).toBe('SHEET_ONLY');
  });
});
```

**Test: `listProblems()` excludes sheet-scoped problems**
```typescript
describe('ProblemService.listProblems', () => {
  it('should exclude problems with isSheetScoped=true', async () => {
    // Create a sheet-scoped problem
    await problemService.createProblemInSheet(dto, userId, sheetId);

    // Create a standalone problem
    await problemService.createProblem(dto, userId);

    const problems = await problemService.listProblems();

    expect(problems.length).toBe(1);
    expect(problems[0].isSheetScoped).toBe(false);
  });
});
```

#### Sheet Progress Service Tests

**Test: `incrementalUpdateSheetProgress()` updates counters correctly**
```typescript
describe('SheetProgressService.incrementalUpdateSheetProgress', () => {
  it('should increment solved count when problem solved for first time', async () => {
    const snapshot = await snapshotModel.create({
      studentId: 'student1',
      sheetId: 'sheet1',
      solvedProblemsCount: 0,
      totalProblems: 5,
      completionPercentage: 0,
      completed: false,
      completedProblemIds: [],
    });

    await sheetProgressService.incrementalUpdateSheetProgress('student1', 'sheet1', 'problem1');

    const updated = await snapshotModel.findOne({ studentId: 'student1', sheetId: 'sheet1' });
    expect(updated.solvedProblemsCount).toBe(1);
    expect(updated.completedProblemIds).toContain('problem1');
  });

  it('should not increment if problem already solved', async () => {
    const snapshot = await snapshotModel.create({
      studentId: 'student1',
      sheetId: 'sheet1',
      solvedProblemsCount: 1,
      totalProblems: 5,
      completionPercentage: 20,
      completed: false,
      completedProblemIds: ['problem1'],
    });

    await sheetProgressService.incrementalUpdateSheetProgress('student1', 'sheet1', 'problem1');

    const updated = await snapshotModel.findOne({ studentId: 'student1', sheetId: 'sheet1' });
    expect(updated.solvedProblemsCount).toBe(1); // Should remain 1
  });
});
```

### Frontend Tests

#### Sheet Editor Component Tests

**Test: Sheet editor loads problems**
```typescript
describe('SheetEditor', () => {
  it('should load and display problems for the sheet', async () => {
    render(<SheetEditor sheetId="sheet1" instructorId="instructor1" />);

    await waitFor(() => {
      expect(screen.getByText('Problems')).toBeInTheDocument();
    });
  });
});
```

**Test: Problem creation dialog opens**
```typescript
describe('SheetEditor', () => {
  it('should open problem creation dialog when Add Problem clicked', async () => {
    render(<SheetEditor sheetId="sheet1" instructorId="instructor1" />);

    const addButton = screen.getByText('Add Problem');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Create Problem in Sheet')).toBeInTheDocument();
    });
  });
});
```

## Integration Tests

### Backend Integration Tests

**Test: Sheet creation → auto-redirect flow**
```typescript
describe('Sheet Creation Flow', () => {
  it('should create sheet and return ID for redirect', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/problem-solving/sheets')
      .send({
        title: 'Test Sheet',
        description: 'Test Description',
        status: 'draft',
      })
      .expect(201);

    expect(response.body._id).toBeDefined();
    expect(response.body.title).toBe('Test Sheet');
  });
});
```

**Test: Problem creation in sheet → isolation from global lists**
```typescript
describe('Sheet Problem Isolation', () => {
  it('should create problem in sheet and exclude from global list', async () => {
    // Create sheet
    const sheet = await createSheet();

    // Create problem in sheet
    const problem = await request(app.getHttpServer())
      .post(`/api/v1/problem-solving/sheets/${sheet._id}/problems`)
      .send(problemDto)
      .expect(201);

    // Verify it's in sheet
    const sheetProblems = await request(app.getHttpServer())
      .get(`/api/v1/problem-solving/sheets/${sheet._id}/problems`)
      .expect(200);

    expect(sheetProblems.body).toHaveLength(1);

    // Verify it's NOT in global list
    const globalProblems = await request(app.getHttpServer())
      .get('/api/v1/instructor/problems')
      .expect(200);

    expect(globalProblems.body).toHaveLength(0);
  });
});
```

**Test: Progress tracking with incremental updates**
```typescript
describe('Incremental Progress Tracking', () => {
  it('should update progress incrementally on submission', async () => {
    const studentId = 'student1';
    const sheetId = 'sheet1';
    const problemId = 'problem1';

    // Create initial progress
    await snapshotModel.create({
      studentId,
      sheetId,
      solvedProblemsCount: 0,
      totalProblems: 5,
      completionPercentage: 0,
      completed: false,
      completedProblemIds: [],
    });

    // Simulate problem submission (solved)
    await problemProgressModel.create({
      userId: studentId,
      problemId,
      solved: true,
    });

    // Trigger progress update
    await sheetProgressService.syncSheetsContainingProblem(studentId, problemId);

    // Verify incremental update
    const snapshot = await snapshotModel.findOne({ studentId, sheetId });
    expect(snapshot.solvedProblemsCount).toBe(1);
    expect(snapshot.completedProblemIds).toContain(problemId);
  });
});
```

### Frontend Integration Tests

**Test: API functions work correctly**
```typescript
describe('Sheet Problem API Functions', () => {
  it('should create problem in sheet', async () => {
    const result = await createProblemInSheetMutationFn({
      sheetId: 'sheet1',
      payload: problemDto,
    });

    expect(result._id).toBeDefined();
    expect(result.sheetId).toBe('sheet1');
    expect(result.isSheetScoped).toBe(true);
  });

  it('should get problems by sheet', async () => {
    const result = await getProblemsBySheetQueryFn('sheet1');

    expect(Array.isArray(result)).toBe(true);
    expect(result.every(p => p.sheetId === 'sheet1')).toBe(true);
  });
});
```

## End-to-End Tests

### Complete Sheet-First Workflow

**Test 1: Create sheet → auto-redirect → add problems**
```typescript
describe('E2E: Sheet-First Workflow', () => {
  it('should complete full sheet creation and problem addition flow', async () => {
    // Step 1: Navigate to problem-solving management
    await page.goto('/instructor/instructor1/(lms)/problem-solving-management');

    // Step 2: Click "New Sheet"
    await page.click('button:has-text("New Sheet")');

    // Step 3: Fill sheet details
    await page.fill('input[name="title"]', 'Test Sheet');
    await page.fill('textarea[name="description"]', 'Test Description');

    // Step 4: Create sheet
    await page.click('button:has-text("Create Sheet")');

    // Step 5: Verify auto-redirect to editor
    await page.waitForURL(/\/sheets\/[^/]+\/editor/);
    expect(page.url()).toMatch(/\/sheets\/[^/]+\/editor/);

    // Step 6: Click "Add Problem"
    await page.click('button:has-text("Add Problem")');

    // Step 7: Fill problem details
    await page.fill('input[placeholder="Problem title"]', 'Test Problem');
    await page.fill('textarea[placeholder="Problem description"]', 'Test Description');
    await page.fill('input[placeholder="Function name"]', 'testFunction');

    // Step 8: Select difficulty
    await page.click('text=medium');

    // Step 9: Select category
    await page.click('text=Arrays');

    // Step 10: Add test case
    await page.fill('input[placeholder*="Case 1 input"]', '[]');
    await page.fill('input[placeholder*="Case 1 expected"]', '[]');

    // Step 11: Create problem
    await page.click('button:has-text("Create Problem")');

    // Step 12: Verify problem appears in list
    await page.waitForSelector('text=Test Problem');
    expect(await page.textContent('text=Test Problem')).toBeTruthy();
  });
});
```

### Backward Compatibility Tests

**Test 2: Standalone problems still work**
```typescript
describe('E2E: Backward Compatibility', () => {
  it('should still create and list standalone problems', async () => {
    // Navigate to problem-solving management
    await page.goto('/instructor/instructor1/(lms)/problem-solving-management');

    // Switch to Problems tab
    await page.click('text=Problems');

    // Click "New Problem"
    await page.click('button:has-text("New Problem")');

    // Fill problem details
    await page.fill('input[placeholder="Problem title"]', 'Standalone Problem');
    await page.fill('textarea[placeholder="Problem description"]', 'Test Description');
    await page.fill('input[placeholder="Function name"]', 'standaloneFunction');

    // Create problem
    await page.click('button:has-text("Create Problem")');

    // Verify problem appears in global list
    await page.waitForSelector('text=Standalone Problem');
    expect(await page.textContent('text=Standalone Problem')).toBeTruthy();

    // Verify it's NOT sheet-scoped
    const problemData = await getProblemData('Standalone Problem');
    expect(problemData.isSheetScoped).toBe(false);
    expect(problemData.visibilityScope).toBe('PUBLIC');
  });
});
```

**Test 3: Existing submissions still work**
```typescript
describe('E2E: Submission Compatibility', () => {
  it('should handle submissions for both sheet and standalone problems', async () => {
    // Test standalone problem submission
    const standaloneResult = await submitCode('standaloneProblemId', 'function solution() {}');
    expect(standaloneResult.status).toBe('accepted');

    // Test sheet problem submission
    const sheetResult = await submitCode('sheetProblemId', 'function solution() {}');
    expect(sheetResult.status).toBe('accepted');

    // Verify progress updated correctly for both
    const standaloneProgress = await getProblemProgress('standaloneProblemId');
    expect(standaloneProgress.solved).toBe(true);

    const sheetProgress = await getSheetProgress('sheetId');
    expect(sheetProgress.solvedProblemsCount).toBeGreaterThan(0);
  });
});
```

## Performance Tests

### Load Testing

**Test: Submission handling with incremental updates**
```typescript
describe('Performance: Submission Load', () => {
  it('should handle 100 concurrent submissions without server crash', async () => {
    const submissions = Array.from({ length: 100 }, (_, i) =>
      submitCode(`problem${i}`, 'function solution() {}')
    );

    const results = await Promise.all(submissions);

    // All should complete successfully
    results.forEach(result => {
      expect(result.status).toBeDefined();
    });

    // Server should still be responsive
    const healthCheck = await checkServerHealth();
    expect(healthCheck.status).toBe('ok');
  });
});
```

**Test: Problem query performance**
```typescript
describe('Performance: Query Performance', () => {
  it('should query global problems in under 100ms', async () => {
    const start = Date.now();
    await problemService.listProblems();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('should query sheet problems in under 100ms', async () => {
    const start = Date.now();
    await problemService.getProblemsBySheet('sheet1');
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });
});
```

## Migration Tests

### Migration Up Test

```typescript
describe('Migration 001: Up', () => {
  it('should add new fields to existing problems', async () => {
    // Create a problem before migration
    const problem = await problemModel.create({
      title: 'Test Problem',
      description: 'Test',
      constraints: 'Test',
      functionName: 'test',
      testCases: [],
      difficulty: 'easy',
      categories: ['arrays'],
      createdBy: 'user1',
    });

    // Run migration up
    await migration.up();

    // Verify new fields added
    const updated = await problemModel.findById(problem._id);
    expect(updated.sheetId).toBe(null);
    expect(updated.isSheetScoped).toBe(false);
    expect(updated.visibilityScope).toBe('PUBLIC');
  });

  it('should create SheetProgressSnapshot collection', async () => {
    await migration.up();

    const snapshot = await snapshotModel.create({
      studentId: 'student1',
      sheetId: 'sheet1',
      solvedProblemsCount: 0,
      totalProblems: 5,
      completionPercentage: 0,
      completed: false,
      completedProblemIds: [],
    });

    expect(snapshot._id).toBeDefined();
  });
});
```

### Migration Down Test

```typescript
describe('Migration 001: Down', () => {
  it('should remove new fields from problems', async () => {
    // Create problem with new fields
    await problemModel.create({
      title: 'Test Problem',
      description: 'Test',
      constraints: 'Test',
      functionName: 'test',
      testCases: [],
      difficulty: 'easy',
      categories: ['arrays'],
      createdBy: 'user1',
      sheetId: 'sheet1',
      isSheetScoped: true,
      visibilityScope: 'SHEET_ONLY',
    });

    // Run migration down
    await migration.down();

    // Verify fields removed
    const problem = await problemModel.findOne({ title: 'Test Problem' });
    expect(problem.sheetId).toBeUndefined();
    expect(problem.isSheetScoped).toBeUndefined();
    expect(problem.visibilityScope).toBeUndefined();
  });

  it('should drop SheetProgressSnapshot collection', async () => {
    await migration.up(); // Create collection
    await migration.down(); // Drop collection

    const count = await snapshotModel.countDocuments();
    expect(count).toBe(0);
  });
});
```

## Test Execution

### Run All Tests

```bash
# Backend unit tests
npm test

# Frontend unit tests
npm run test:frontend

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Migration tests
npm run test:migration
```

### Run Specific Test Suites

```bash
# Problem service tests only
npm test -- problem.service.spec

# Sheet progress service tests only
npm test -- sheet-progress.service.spec

# Sheet editor component tests only
npm run test:frontend -- sheet-editor.spec
```

## Test Data Setup

### Seed Test Data

```typescript
// scripts/seed-test-data.ts
async function seedTestData() {
  // Create test users
  const instructor = await userModel.create({
    email: 'instructor@test.com',
    role: 'instructor',
  });

  const student = await userModel.create({
    email: 'student@test.com',
    role: 'student',
  });

  // Create test sheet
  const sheet = await sheetModel.create({
    title: 'Test Sheet',
    description: 'Test Description',
    status: 'draft',
    createdBy: instructor._id,
  });

  // Create test problems
  const standaloneProblem = await problemModel.create({
    title: 'Standalone Problem',
    description: 'Test',
    constraints: 'Test',
    functionName: 'standalone',
    testCases: [],
    difficulty: 'easy',
    categories: ['arrays'],
    createdBy: instructor._id,
    isSheetScoped: false,
    visibilityScope: 'PUBLIC',
  });

  const sheetProblem = await problemModel.create({
    title: 'Sheet Problem',
    description: 'Test',
    constraints: 'Test',
    functionName: 'sheet',
    testCases: [],
    difficulty: 'medium',
    categories: ['strings'],
    createdBy: instructor._id,
    sheetId: sheet._id,
    isSheetScoped: true,
    visibilityScope: 'SHEET_ONLY',
  });

  console.log('Test data seeded successfully');
}
```

## Test Reporting

### Coverage Report

```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Performance Report

```bash
# Run performance tests with reporting
npm run test:performance -- --reporter=json
```

## Post-Test Verification

After running all tests:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Migration tests pass
- [ ] Coverage threshold met (>80%)
- [ ] Performance benchmarks met
- [ ] No memory leaks detected
- [ ] No race conditions detected

## Known Issues and Limitations

1. **Drag-and-drop ordering**: UI implemented but backend integration pending
2. **Inline edit**: UI implemented but backend integration pending
3. **Submission debounce**: Not yet implemented
4. **Student progress UI**: Not yet updated for incremental updates

These items are marked as medium priority and can be addressed in future iterations.

## Troubleshooting

### Common Test Failures

**Migration test fails**
- Check database connection
- Verify migration script syntax
- Ensure test database is clean before running

**E2E test fails on auto-redirect**
- Check router configuration
- Verify mutation hook is correctly imported
- Check browser console for errors

**Performance test fails**
- Check server resources
- Verify database indexes are created
- Check for blocking operations in code

## Contact

For test-related issues or questions, contact the development team or review the main documentation at `docs/AI/generative-ai/problem-solving-sheets-refactor.md`.
