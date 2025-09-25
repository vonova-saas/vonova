// import { Request, Response } from "express";
// import { asyncHandler } from "../middlewares/api/asyncHandler.middleware";
// import { HTTPSTATUS } from "../config/http.config";
// import {
//   getDashboardDataService,
//   updateDashboardDataService,
//   updateLearningProgressService,
//   addQuizPerformanceService,
//   updateAIRoadmapService,
//   addAIVideoSuggestionService,
//   addCourseCreatedService,
//   trackUserActivityService,
// } from "../services/dashboard.service";
// import { NotFoundException } from "../utils/appError";

// //? ============ Dashboard data Controllers ============
// //* ----------- Student Dashboard Controllers -----------
// // Learning progress tracking (Student)
// export const updateLearningProgressController = asyncHandler(
//   async (req: Request, res: Response) => {
//     const userId = req.params.userId;
//     const { courseId, progress } = req.body;
//     const dashboard = await updateLearningProgressService(userId, courseId, progress);
//     res.status(HTTPSTATUS.OK).json({
//       message: "Learning progress updated",
//       data: dashboard
//     });
//   }
// );

// // Quiz performance tracking (Student)
// export const addQuizPerformanceController = asyncHandler(
//   async (req: Request, res: Response) => {
//     const userId = req.params.userId;
//     const { quizId, courseId, score } = req.body;
//     const dashboard = await addQuizPerformanceService(userId, quizId, courseId, score);
//     res.status(HTTPSTATUS.OK).json({
//       message: "Quiz performance added",
//       data: dashboard
//     });
//   }
// );

// // AI features integration (Student)
// export const updateAIRoadmapController = asyncHandler(
//   async (req: Request, res: Response) => {
//     const userId = req.params.userId;
//     const { topics, recommendedOrder } = req.body;
//     const dashboard = await updateAIRoadmapService(userId, { topics, recommendedOrder });
//     res.status(HTTPSTATUS.OK).json({
//       message: "AI roadmap updated",
//       data: dashboard
//     });
//   }
// );

// export const addAIVideoSuggestionController = asyncHandler(
//   async (req: Request, res: Response) => {
//     const userId = req.params.userId;
//     const { topic, videoUrl } = req.body;
//     const dashboard = await addAIVideoSuggestionService(userId, { topic, videoUrl });
//     res.status(HTTPSTATUS.OK).json({
//       message: "AI video suggestion added",
//       data: dashboard
//     });
//   }
// );

// //* ----------- Instructor Dashboard Controllers -----------
// export const addCourseCreatedController = asyncHandler(
//   async (req: Request, res: Response) => {
//     const userId = req.params.userId;
//     const course = req.body;
//     const dashboard = await addCourseCreatedService(userId, course);
//     res.status(HTTPSTATUS.OK).json({
//       message: "Course created added to instructor dashboard",
//       data: dashboard
//     });
//   }
// );

// //* ----------- Shared/Other Services -----------
// // Get dashboard data
// export const getDashboardDataController = asyncHandler(
//   async (req: Request, res: Response) => {
//     const userId = req.params.userId;
//     const requesterId = req.user?.id;
//     const role = req.user?.role || 'STUDENT';

//     // Users can only access their own dashboard (unless admin)
//     if (requesterId && requesterId !== userId && req.user?.role !== 'ADMIN') {
//       throw new NotFoundException("You can only access your own dashboard");
//     }

//     const dashboard = await getDashboardDataService(userId, role);
//     return res.status(HTTPSTATUS.OK).json({
//       message: "Dashboard data fetched successfully",
//       data: dashboard,
//     });
//   }
// );

// // update dashboard data
// export const updateDashboardDataController = asyncHandler(
//   async (req: Request, res: Response) => {
//     const userId = req.params.userId;
//     const requesterId = req.user?.id;
//     const role = req.user?.role || 'STUDENT';

//     // Users can only update their own dashboard (unless admin)
//     if (requesterId && requesterId !== userId && req.user?.role !== 'ADMIN') {
//       throw new NotFoundException("You can only update your own dashboard");
//     }

//     const dashboard = await updateDashboardDataService(userId, role, req.body);
//     return res.status(HTTPSTATUS.OK).json({
//       message: "Dashboard data updated successfully",
//       data: dashboard,
//     });
//   }
// );

// // User activity tracking
// export const trackUserActivityController = asyncHandler(
//   async (req: Request, res:Response) => {
//     const userId = req.params.userId;
//     const activity = req.body;

//     await trackUserActivityService(userId, activity);

//     res.status(HTTPSTATUS.OK).json({
//       message: "User activity tracked successfully"
//     });
//   }
// );

