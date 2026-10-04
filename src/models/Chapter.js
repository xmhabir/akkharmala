import mongoose from 'mongoose';

const ChapterSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    bookSlug: {
      type: String,
      required: true,
      index: true,
    },
    chapterNumber: {
      type: Number,
      required: true,
    },
    chapterTitle: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying a specific chapter in a book
ChapterSchema.index({ bookSlug: 1, chapterNumber: 1 }, { unique: true });

export default mongoose.models.Chapter || mongoose.model('Chapter', ChapterSchema);
