import mongoose from "mongoose";
import { Env } from "./env.config";

const connections: { [key: string]: mongoose.Connection } = {};

const connectDatabase = async () => {
  try {
    // Connect to main database (ROADMAP_AI)
    await mongoose.connect(Env.MONGO_URI_LMS_AI);
    console.log("Connected to ROADMAP_AI database");
    connections.roadmap = mongoose.connection;
    
    // Create separate connections for other services
    await createServiceConnections();
    console.log("All database connections established successfully");
  } catch (error) {
    console.log("Error connecting to databases");
    if (Env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

const createServiceConnections = async () => {
  try {
    // Roadmap AI Service Database
    const roadmapConnection = mongoose.createConnection(Env.MONGO_URI_ROADMAP_AI, {
      dbName: 'ROADMAP_AI'
    });
    
    roadmapConnection.on('connected', () => {
      console.log("Connected to ROADMAP_AI database");
    });
    
    roadmapConnection.on('error', (error) => {
      console.error("ROADMAP_AI database connection error:", error);
    });
    
    connections.roadmap = roadmapConnection;

    // PDF Summary Service Database
    const pdfSummaryConnection = mongoose.createConnection(Env.MONGO_URI_PDF_SUMMARY, {
      dbName: 'PDF_SUMMARY'
    });
    
    pdfSummaryConnection.on('connected', () => {
      console.log("Connected to PDF_SUMMARY database");
    });
    
    pdfSummaryConnection.on('error', (error) => {
      console.error("PDF_SUMMARY database connection error:", error);
    });
    
    connections.pdfSummary = pdfSummaryConnection;
    
    // Problem Solver Service Database
    const problemSolverConnection = mongoose.createConnection(Env.MONGO_URI_PROBLEM_SOLVER, {
      dbName: 'PROBLEM_SOLVER'
    });
    
    problemSolverConnection.on('connected', () => {
      console.log("Connected to PROBLEM_SOLVER database");
    });
    
    problemSolverConnection.on('error', (error) => {
      console.error("PROBLEM_SOLVER database connection error:", error);
    });
    
    connections.problemSolver = problemSolverConnection;
    
    // Assistant Service Database
    const assistantConnection = mongoose.createConnection(Env.MONGO_URI_ASSISTANT, {
      dbName: 'ASSISTANT'
    });
    
    assistantConnection.on('connected', () => {
      console.log("Connected to ASSISTANT database");
    });
    
    assistantConnection.on('error', (error) => {
      console.error("ASSISTANT database connection error:", error);
    });
    
    connections.assistant = assistantConnection;
    
    // Video Generator Service Database
    const videoGenConnection = mongoose.createConnection(Env.MONGO_URI_VIDEO_GEN, {
      dbName: 'VIDEO_GEN'
    });
    
    videoGenConnection.on('connected', () => {
      console.log("Connected to VIDEO_GEN database");
    });
    
    videoGenConnection.on('error', (error) => {
      console.error("VIDEO_GEN database connection error:", error);
    });
    
    connections.videoGen = videoGenConnection;
    
  } catch (error) {
    console.error("Error creating service connections:", error);
  }
};

export const getServiceConnection = (serviceName: string): mongoose.Connection => {
  return connections[serviceName] || mongoose.connection;
};

export const getAllConnections = () => connections;

export default connectDatabase;
