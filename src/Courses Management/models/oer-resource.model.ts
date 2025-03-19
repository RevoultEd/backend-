import mongoose, { Document, Schema } from 'mongoose';

export interface IOERResource extends Document {
  title: string;
  description: string;
  provider: string;
  url: string;
  type: 'video' | 'text' | 'quiz' | 'audio';
  language: string;
  license: string;
  subjects: string[];
  curriculum_tags?: string[];
  NERDC_topic_code?: string;
  download_count: number;
  created_at: Date;
  updated_at: Date;
  metadata?: {
    file_size?: number; // in KB
    duration?: number; // in minutes
    author?: string;
  };
}

const OERResourceSchema: Schema<IOERResource> = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  provider: {
    type: String,
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'text', 'quiz', 'audio'],
    required: true,
    index: true
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'ha', 'yo', 'ig'],
    index: true
  },
  license: {
    type: String,
    required: true
  },
  subjects: [{
    type: String,
    index: true
  }],
  curriculum_tags: [{
    type: String,
    enum: ['NERDC', 'WAEC', 'NECO']
  }],
  NERDC_topic_code: {
    type: String,
    index: true
  },
  download_count: {
    type: Number,
    default: 0
  },
  metadata: {
    file_size: Number,
    duration: Number,
    author: String
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

export default mongoose.model<IOERResource>('OERResource', OERResourceSchema, 'oer_resources');