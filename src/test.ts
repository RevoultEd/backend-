import mongoose, { Document, Schema } from 'mongoose';

// Learning outcome tracking
export interface ILearningOutcome extends Document {
  user_id: mongoose.Types.ObjectId;
  course_id: mongoose.Types.ObjectId;
  activity_date: Date;
  activity_type: 'quiz' | 'assignment' | 'project' | 'exam';
  score: number;
  max_score: number;
  percentage: number;
  NERDC_competency_code?: string;
  curriculum_tag?: string;
  topic: string;
  competency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  created_at: Date;
}

const LearningOutcomeSchema: Schema<ILearningOutcome> = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UnifiedCourse',
    required: true,
    index: true
  },
  activity_date: {
    type: Date,
    required: true,
    index: true
  },
  activity_type: {
    type: String,
    enum: ['quiz', 'assignment', 'project', 'exam'],
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  max_score: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  NERDC_competency_code: String,
  curriculum_tag: String,
  topic: String,
  competency_level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Attendance tracking
export interface IAttendanceRecord extends Document {
  user_id: mongoose.Types.ObjectId;
  login_date: Date;
  logout_date?: Date;
  ip_address: string;
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  device_info?: string;
  session_duration?: number;
  created_at: Date;
}

const AttendanceRecordSchema: Schema<IAttendanceRecord> = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  login_date: {
    type: Date,
    required: true,
    index: true
  },
  logout_date: Date,
  ip_address: {
    type: String,
    required: true
  },
  geolocation: {
    country: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number
  },
  device_info: String,
  session_duration: Number,
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Content engagement tracking
export interface IContentEngagement extends Document {
  content_id: mongoose.Types.ObjectId;
  content_type: 'course' | 'oer_resource';
  date: Date;
  views: number;
  downloads: number;
  completions: number;
  avg_rating: number;
  rating_count: number;
  created_at: Date;
}

const ContentEngagementSchema: Schema<IContentEngagement> = new Schema({
  content_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    refPath: 'content_type'
  },
  content_type: {
    type: String,
    required: true,
    enum: ['course', 'oer_resource']
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  completions: {
    type: Number,
    default: 0
  },
  avg_rating: {
    type: Number,
    default: 0
  },
  rating_count: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Curriculum progress tracking
export interface ICurriculumProgress extends Document {
  user_id: mongoose.Types.ObjectId;
  curriculum_code: string;
  subject: string;
  topics_completed: string[];
  topics_total: number;
  progress_percentage: number;
  last_activity_date: Date;
  competency_scores: {
    [topic: string]: number;
  };
  created_at: Date;
  updated_at: Date;
}

const CurriculumProgressSchema: Schema<ICurriculumProgress> = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  curriculum_code: {
    type: String,
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true
  },
  topics_completed: [String],
  topics_total: {
    type: Number,
    required: true
  },
  progress_percentage: {
    type: Number,
    default: 0
  },
  last_activity_date: {
    type: Date,
    default: Date.now
  },
  competency_scores: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

// Create and export models
export const LearningOutcome = mongoose.model<ILearningOutcome>('LearningOutcome', LearningOutcomeSchema);
export const AttendanceRecord = mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);
export const ContentEngagement = mongoose.model<IContentEngagement>('ContentEngagement', ContentEngagementSchema);
export const CurriculumProgress = mongoose.model<ICurriculumProgress>('CurriculumProgress', CurriculumProgressSchema);