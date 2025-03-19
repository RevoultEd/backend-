import mongoose, { Document, Schema } from 'mongoose';

export interface IUnifiedCourse extends Document {
  original_id: string;
  title: string;
  short_title: string;
  description: string;
  source: 'moodle' | 'openedx';
  type: 'secondary' | 'university';
  format: string;
  language: string;
  approved: boolean;
  creator?: mongoose.Types.ObjectId;
  NERDC_topic_code?: string;
  curriculum_tags?: string[];
  subjects?: string[];
  download_count: number;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  created_at: Date;
  updated_at: Date;
  media?: {
    image_url?: string;
    video_url?: string;
  };
  metadata?: {
    difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
    estimated_duration?: number; // in minutes
    prerequisites?: string[];
  };
  oer_resources?: {
    provider: string;
    url: string;
    type: 'video' | 'text' | 'quiz' | 'audio';
    license: string;
  }[];
}

const UnifiedCourseSchema: Schema<IUnifiedCourse> = new Schema({
  original_id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  short_title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    enum: ['moodle', 'openedx'],
    required: true
  },
  type: {
    type: String,
    enum: ['secondary', 'university'],
    required: true
  },
  format: {
    type: String,
    default: 'online'
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'ha', 'yo', 'ig'],
    index: true
  },
  approved: {
    type: Boolean,
    default: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  NERDC_topic_code: {
    type: String,
    index: true
  },
  curriculum_tags: [{
    type: String,
    enum: ['NERDC', 'WAEC', 'NECO']
  }],
  subjects: [{
    type: String,
    index: true
  }],
  download_count: {
    type: Number,
    default: 0
  },
  category: String,
  startDate: Date,
  endDate: Date,
  media: {
    image_url: String,
    video_url: String
  },
  metadata: {
    difficulty_level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    estimated_duration: Number,
    prerequisites: [String]
  },
  oer_resources: [{
    provider: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['video', 'text', 'quiz', 'audio'],
      required: true
    },
    license: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  },
  indexes: [
    { source: 1, original_id: 1 },
    { subjects: 1 },
    { language: 1 },
    { type: 1 },
    { curriculum_tags: 1 }
  ]
});

export default mongoose.model<IUnifiedCourse>('UnifiedCourse', UnifiedCourseSchema, 'unified_courses');