import mongoose, { Document, Schema, Model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface IComment extends Document {
  content_id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  text: string;
  parent_id?: mongoose.Types.ObjectId;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

interface ICommentModel extends Model<IComment> {
  paginate: (__query: any, __options: any) => any; // Add paginate method
}

const CommentSchema: Schema<IComment> = new Schema({
  content_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: [true, 'Content ID is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot be more than 1000 characters']
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  is_deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  },
  indexes: [
    { content_id: 1 },
    { user: 1 },
    { parent_id: 1 },
    { created_at: -1 }
  ]
});

// Add pagination plugin
CommentSchema.plugin(mongoosePaginate);

export default mongoose.model<IComment, ICommentModel>('Comment', CommentSchema, 'Comments');