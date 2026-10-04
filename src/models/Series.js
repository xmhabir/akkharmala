import mongoose from 'mongoose';

const SeriesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'সিরিজের নাম আবশ্যক'],
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    author: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    image: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Series || mongoose.model('Series', SeriesSchema);
