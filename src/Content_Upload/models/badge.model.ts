import mongoose, { Document, Schema, Types  } from 'mongoose';

export interface IBadge extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  icon_url: string;
  criteria_type: 'contribution_count' | 'download_count' | 'upvote_count' | 'manual';
  criteria_value: number;
  created_at: Date;
  updated_at: Date;
}

const BadgeSchema: Schema<IBadge> = new Schema({
  name: {
    type: String,
    required: [true, 'Badge name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Badge name cannot be more than 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Badge description is required'],
    trim: true,
    maxlength: [200, 'Badge description cannot be more than 200 characters']
  },
  icon_url: {
    type: String,
    required: [true, 'Badge icon URL is required']
  },
  criteria_type: {
    type: String,
    required: [true, 'Badge criteria type is required'],
    enum: ['contribution_count', 'download_count', 'upvote_count', 'manual']
  },
  criteria_value: {
    type: Number,
    required: [true, 'Badge criteria value is required'],
    min: [1, 'Criteria value must be at least 1']
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

export default mongoose.model<IBadge & Document>('Badge', BadgeSchema, 'Badges');