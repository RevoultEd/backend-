import mongoose, { Document, Schema } from 'mongoose';

export interface IContentVersion extends Document {
  content_id: mongoose.Types.ObjectId;
  content_type: 'course' | 'oer_resource';
  version_hash: string;
  version_number: number;
  changes: string[];
  created_at: Date;
  created_by?: mongoose.Types.ObjectId;
}

const ContentVersionSchema: Schema<IContentVersion> = new Schema({
  content_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'content_type',
    index: true
  },
  content_type: {
    type: String,
    required: true,
    enum: ['course', 'oer_resource']
  },
  version_hash: {
    type: String,
    required: true
  },
  version_number: {
    type: Number,
    required: true
  },
  changes: [{
    type: String
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { 
    createdAt: 'created_at',
    updatedAt: false
  }
});

// Index for efficient retrieval of latest versions
ContentVersionSchema.index({ content_id: 1, version_number: -1 });

export default mongoose.model<IContentVersion>('ContentVersion', ContentVersionSchema, 'content_versions');