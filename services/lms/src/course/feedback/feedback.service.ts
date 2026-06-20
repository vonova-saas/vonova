import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument } from '../course/schema/course.schema';
import {
  Enrollment,
  EnrollmentDocument,
} from '../enroll/schema/enrollment.schema';
import { Feedback, FeedbackDocument } from './schema/feedback.schema';
import { AnalyzeCourseFeedbackDto } from './dto/feedback.dto';

@Injectable()
export class CourseFeedbackService {
  private readonly logger = new Logger(CourseFeedbackService.name);

  constructor(
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Feedback.name) private readonly feedbackModel: Model<FeedbackDocument>,
  ) {}

  async analyzeCourseFeedback(
    dto: AnalyzeCourseFeedbackDto,
  ): Promise<{ courseId: string; sentiment: string }> {
    if (dto.role !== 'STUDENT_USER') {
      throw new ForbiddenException('Only students can submit course feedback');
    }

    const course = await this.courseModel.findById(dto.courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const enrolled = await this.enrollmentModel.findOne({
      courseId: dto.courseId,
      userId: dto.userId,
      status: 'ACTIVE',
    });
    if (!enrolled) {
      throw new ForbiddenException(
        'You must be enrolled in this course to submit feedback',
      );
    }

    const sentiment = await this.analyzeFeedbackSentiment(dto.text);

    // Save feedback to database
    await this.feedbackModel.create({
      courseId: dto.courseId,
      userId: dto.userId,
      text: dto.text,
      sentiment,
    });

    this.logger.log(`Feedback saved for course ${dto.courseId} with sentiment: ${sentiment}`);

    return { courseId: dto.courseId, sentiment };
  }

  private async analyzeFeedbackSentiment(text: string): Promise<string> {
    try {
      this.logger.log(`Analyzing sentiment for text: "${text.substring(0, 100)}..."`);
      
      const response = await fetch(
        'https://badawi010-vonova-feedback-2.hf.space/predict_feedback',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        },
      );

      this.logger.log(`AI API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`AI API request failed with status ${response.status}: ${errorText}`);
        throw new Error(`AI API request failed with status ${response.status}`);
      }

      const data = await response.json();
      this.logger.log(`AI API response data: ${JSON.stringify(data)}`);
      
      const sentiment = data.sentiment || 'neutral';
      this.logger.log(`Extracted sentiment: ${sentiment}`);
      
      return sentiment;
    } catch (error) {
      this.logger.warn(
        `External AI API failed, falling back to local sentiment analysis: ${error.message}`,
      );
      return this.analyzeSentimentLocally(text);
    }
  }

  private analyzeSentimentLocally(text: string): string {
    const lowerText = text.toLowerCase();
    
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'helpful', 'useful', 'informative', 'well-structured', 'well structured',
      'clear', 'easy', 'love', 'liked', 'best', 'awesome', 'perfect',
      'recommend', 'enjoyed', 'valuable', 'insightful', 'practical',
      'engaging', 'interesting', 'beneficial', 'outstanding', 'superb'
    ];
    
    const negativeWords = [
      'bad', 'poor', 'terrible', 'awful', 'horrible', 'useless',
      'confusing', 'difficult', 'hard', 'boring', 'disappointing',
      'waste', 'hated', 'dislike', 'worst', 'frustrating', 'unclear',
      'messy', 'disorganized', 'not helpful', 'not useful', 'poorly',
      'incomplete', 'lacking', 'missing', 'slow', 'outdated'
    ];

    let positiveScore = 0;
    let negativeScore = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveScore++;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeScore++;
    });

    if (positiveScore > negativeScore) {
      return 'positive';
    } else if (negativeScore > positiveScore) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }
}