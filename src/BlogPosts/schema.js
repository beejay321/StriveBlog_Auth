import mongoose from "mongoose";
const { Schema, model } = mongoose;

const blogPostsSchema = new Schema(
  {
    
    category: { type: String, required: true }, // enum : ["horror", "fantasy"] can be used to restrict values
    title: { type: String, required: true },
    cover: { type: String, required: true },
    readTime: {
      value: { type: Number, required: true },
      unit: { type: String, required: true },
    },
    author: { type: Schema.Types.ObjectId, required: true, ref: "author" },
    // likes: { type: Schema.Types.ObjectId },

    // avatar: { type: String, required: true },

    content: { type: String, required: true },
    comments: [{ name: String, text: String, date: Date }],
  },
  { timestamps: true }
);

export default model("blogPost", blogPostsSchema);
