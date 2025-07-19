import mongoose, { Document, Schema } from "mongoose";
import { UserRoleType, UserRoleEnum } from "../enums/user-role.enum";

export interface UserProfileDocument extends Document {
  userId: string;
  name: string;
  email: string;
  role: UserRoleType;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: Date;
  address?: string;

  // LMS Specific Fields
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  joinedAt: Date;

  // Student Specific Fields
  studentInfo?: {
    level: 'beginner' | 'intermediate' | 'advanced';
    preferredLearningStyle?: 'visual' | 'auditory' | 'kinesthetic';
    timezone?: string;
    studyGoals?: string[];
  };

  // Instructor Specific Fields
  instructorInfo?: {
    specialization: string[];
    experience: number; // years
    education: string[];
    certifications: string[];
    bio: string;
    hourlyRate?: number;
    availability?: {
      days: string[];
      hours: string;
    };
  };

  // Admin Specific Fields
  adminInfo?: {
    permissions: string[];
    department?: string;
    accessLevel: 'super' | 'regular';
  };

  // Social & Contact
  social?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    [key: string]: string | undefined;
  };

  // Preferences
  preferences?: {
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
  };
}

const userProfileSchema = new Schema<UserProfileDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    role: {
      type: String,
      enum: Object.values(UserRoleEnum),
      required: true,
      index: true
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 1000
    },
    phone: {
      type: String,
      default: null,
      maxlength: 20
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    address: {
      type: String,
      maxlength: 500,
      default: null,
    },

    // LMS Specific Fields
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },

    // Student Specific Fields
    studentInfo: {
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
      },
      preferredLearningStyle: {
        type: String,
        enum: ['visual', 'auditory', 'kinesthetic']
      },
      timezone: String,
      studyGoals: [String]
    },

    // Instructor Specific Fields
    instructorInfo: {
      specialization: [String],
      experience: {
        type: Number,
        min: 0
      },
      education: [String],
      certifications: [String],
      bio: {
        type: String,
        maxlength: 2000
      },
      hourlyRate: {
        type: Number,
        min: 0
      },
      availability: {
        days: [String],
        hours: String
      }
    },

    // Admin Specific Fields
    adminInfo: {
      permissions: [String],
      department: String,
      accessLevel: {
        type: String,
        enum: ['super', 'regular'],
      }
    },

    // Social & Contact
    social: {
      type: Object,
      default: {},
    },

    // Preferences
    preferences: {
      language: {
        type: String,
        default: 'en'
      },
      timezone: {
        type: String,
        default: 'UTC'
      },
      emailNotifications: {
        type: Boolean,
        default: true
      },
      pushNotifications: {
        type: Boolean,
        default: true
      },
      marketingEmails: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
userProfileSchema.index({ role: 1, isActive: 1 });
userProfileSchema.index({ email: 1, isVerified: 1 });
userProfileSchema.index({ 'instructorInfo.specialization': 1 });
userProfileSchema.index({ 'studentInfo.level': 1 });

const UserModel = mongoose.model<UserProfileDocument>("User", userProfileSchema);
export default UserModel;