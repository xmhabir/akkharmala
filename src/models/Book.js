import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'বইয়ের শিরোনাম আবশ্যক'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    series: {
      type: String,
      default: 'সাধারণ সংকলন',
      index: true,
    },
    author: {
      type: String,
      default: 'অজানা',
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    chaptersCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Book || mongoose.model('Book', BookSchema);
