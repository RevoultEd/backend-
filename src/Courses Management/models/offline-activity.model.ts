import mongoose, { Document, Schema } from 'mongoose';

export interface IOfflineActivity extends Document {
  user_id: mongoose.Types.ObjectId;
  activity_type: 'quiz_attempt' | 'content_view' | 'download';
  content_id: mongoose.Types.ObjectId;
  content_type: 'course' | 'oer_resource';
  details: {
    quiz_answers?: [{
      question_id: string;
      selected_option: string;
    }];
    view_duration?: number; // in seconds
    download_completed?: boolean;
  };
  created_at: Date;
  synced_at?: Date;
  sync_status: 'pending' | 'synced' | 'failed';
  version_hash?: string; // For content version tracking
}

const OfflineActivitySchema: Schema<IOfflineActivity> = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  activity_type: {
    type: String,
    enum: ['quiz_attempt', 'content_view', 'download'],
    required: true
  },
  content_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'content_type'
  },
  content_type: {
    type: String,
    required: true,
    enum: ['course', 'oer_resource']
  },
  details: {
    quiz_answers: [{
      question_id: String,
      selected_option: String
    }],
    view_duration: Number,
    download_completed: Boolean
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  synced_at: Date,
  sync_status: {
    type: String,
    enum: ['pending', 'synced', 'failed'],
    default: 'pending'
  },
  version_hash: String
}, {
  timestamps: { 
    createdAt: 'created_at',
    updatedAt: false
  }
});

// Indexes for faster queries
OfflineActivitySchema.index({ user_id: 1, sync_status: 1 });
OfflineActivitySchema.index({ content_id: 1, activity_type: 1 });

export default mongoose.model<IOfflineActivity>('OfflineActivity', OfflineActivitySchema, 'offline_activities');