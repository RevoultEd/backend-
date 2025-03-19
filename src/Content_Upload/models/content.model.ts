import mongoose, { Document, Schema, Model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface IContent extends Document {
  title: string;
  description: string;
  subject: string;
  grade_level: string[];
  content_type: 'lesson' | 'quiz' | 'assignment' | 'resource';
  format: 'video' | 'document' | 'presentation' | 'audio' | 'interactive';
  language: string;
  creator: mongoose.Types.ObjectId;
  file_url: string;
  file_size: number;
  thumbnail_url?: string;
  tags: string[];
  is_downloadable: boolean;
  is_moderated: boolean;
  votes: {
    upvotes: number;
    downvotes: number;
    voters: {
      user: mongoose.Types.ObjectId;
      vote: 'up' | 'down';
    }[];
  };
  approved: boolean;
  views: number;
  downloads: number;
  created_at: Date;
  updated_at: Date;
}

const ContentSchema: Schema<IContent> = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      enum: [
        'mathematics',
        'science',
        'language',
        'social_studies',
        'arts',
        'physical_education',
        'technology',
        'other',
      ],
    },
    grade_level: {
      type: [String],
      required: [true, 'Grade level is required'],
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: 'At least one grade level must be specified',
      },
    },
    content_type: {
      type: String,
      required: [true, 'Content type is required'],
      enum: ['lesson', 'quiz', 'assignment', 'resource'],
    },
    format: {
      type: String,
      required: [true, 'Format is required'],
      enum: ['video', 'document', 'presentation', 'audio', 'interactive'],
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      default: 'en',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    file_url: {
      type: String,
      required: [true, 'File URL is required'],
    },
    file_size: {
      type: Number,
      required: [true, 'File size is required'],
    },
    thumbnail_url: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    is_downloadable: {
      type: Boolean,
      default: true,
    },
    is_moderated: {
      type: Boolean,
      default: false,
    },
    votes: {
      upvotes: {
        type: Number,
        default: 0,
      },
      downvotes: {
        type: Number,
        default: 0,
      },
      voters: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          vote: {
            type: String,
            enum: ['up', 'down'],
          },
        },
      ],
    },
    approved: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    indexes: [
      { title: 'text', description: 'text', tags: 'text' },
      { subject: 1 },
      { grade_level: 1 },
      { content_type: 1 },
      { format: 1 },
      { language: 1 },
      { creator: 1 },
      { approved: 1 },
      { is_downloadable: 1 },
      { is_moderated: 1 },
    ],
  }
);

// Extend the model with pagination
ContentSchema.plugin(mongoosePaginate);

// Define an interface for the model with pagination
interface IContentModel extends Model<IContent> {
  paginate: (
    __query: any,
    __options: any
  ) => Promise<{
    docs: IContent[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page?: number;
    pagingCounter?: number;
    hasPrevPage?: boolean;
    hasNextPage?: boolean;
    prevPage?: number | null;
    nextPage?: number | null;
  }>;
}

// Export the model with pagination
const Content = mongoose.model<IContent, IContentModel>('Content', ContentSchema, 'Contents');
export default Content;
