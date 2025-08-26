import mongoose from 'mongoose';
import { Env } from '../config/env.config';

// Migration script to separate databases
async function migrateToSeparateDatabases() {
  try {
    console.log('Starting migration to separate databases...');
    
    // Connect to source database (ROADMAP_AI)
    const sourceConnection = await mongoose.createConnection(Env.MONGO_URI_ROADMAP_AI);
    console.log('Connected to source database (ROADMAP_AI)');
    
    // Connect to target databases
    const pdfSummaryConnection = await mongoose.createConnection(Env.MONGO_URI_PDF_SUMMARY);
    const problemSolverConnection = await mongoose.createConnection(Env.MONGO_URI_PROBLEM_SOLVER);
    const assistantConnection = await mongoose.createConnection(Env.MONGO_URI_ASSISTANT);
    const videoGenConnection = await mongoose.createConnection(Env.MONGO_URI_VIDEO_GEN);
    
    console.log('Connected to target databases');
    
    // Wait for connections to be ready
    await sourceConnection.asPromise();
    await pdfSummaryConnection.asPromise();
    await problemSolverConnection.asPromise();
    await assistantConnection.asPromise();
    await videoGenConnection.asPromise();
    
    // 1. Migrate PDF Summary data
    console.log('\nMigrating PDF Summary data...');
    
    const pdfSummaries = await sourceConnection.db?.collection('pdf_summaries').find({}).toArray() || [];
    const pdfChatHistory = await sourceConnection.db?.collection('pdf_chat_history').find({}).toArray() || [];
    
    console.log(`Found ${pdfSummaries.length} PDF summaries`);
    console.log(`Found ${pdfChatHistory.length} PDF chat history records`);
    
    // Insert into PDF_SUMMARY database
    if (pdfSummaries.length > 0) {
      await pdfSummaryConnection.db?.collection('pdf_summaries').insertMany(pdfSummaries);
      console.log('PDF summaries migrated to PDF_SUMMARY database');
    }
    
    if (pdfChatHistory.length > 0) {
      await pdfSummaryConnection.db?.collection('pdf_chat_history').insertMany(pdfChatHistory);
      console.log('PDF chat history migrated to PDF_SUMMARY database');
    }
    
    // 2. Keep Roadmap data in ROADMAP_AI
    console.log('\nRoadmap data stays in ROADMAP_AI database');
    
    const roadmaps = await sourceConnection.db?.collection('roadmaps').find({}).toArray() || [];
    const roadmapHistory = await sourceConnection.db?.collection('roadmaphistories').find({}).toArray() || [];
    const roadmapResponses = await sourceConnection.db?.collection('roadmapresponses').find({}).toArray() || [];
    
    console.log(`Found ${roadmaps.length} roadmaps`);
    console.log(`Found ${roadmapHistory.length} roadmap history records`);
    console.log(`Found ${roadmapResponses.length} roadmap response records`);
    
    // 3. Clean up source database (remove PDF data)
    console.log('\nCleaning up source database...');
    
    if (pdfSummaries.length > 0) {
      await sourceConnection.db?.collection('pdf_summaries').deleteMany({});
      console.log('Removed PDF summaries from ROADMAP_AI database');
    }
    
    if (pdfChatHistory.length > 0) {
      await sourceConnection.db?.collection('pdf_chat_history').deleteMany({});
      console.log('Removed PDF chat history from ROADMAP_AI database');
    }
    
    console.log('\nMigration completed successfully!');
    console.log('\nFinal database structure:');
    console.log('├── ROADMAP_AI: roadmaps, roadmaphistories, roadmapresponses');
    console.log('├── PDF_SUMMARY: pdf_summaries, pdf_chat_history');
    console.log('├── PROBLEM_SOLVER: (empty)');
    console.log('├── ASSISTANT: (empty)');
    console.log('└── VIDEO_GEN: (empty)');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connections
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run migration
migrateToSeparateDatabases();
