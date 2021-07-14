import express from "express"; // third party module(needs to ne installed)
import { validationResult } from "express-validator";
import createError from "http-errors";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { generatePDFStream } from "../lib/pdf.js";
import { pipeline } from "stream";
import { Transform } from "json2csv";
import blogPostsModel from "./schema.js";

const BlogPostsRouter = express.Router();

/****************POST BLOGPOSTS******************/

BlogPostsRouter.post("/", async (req, res, next) => {
  try {
    const newPost = new blogPostsModel(req.body);

    const mongoRes = await newPost.save();
    res.status(201).send(mongoRes);
  } catch (error) {
    next(error);
  }
});

/****************GET POSTS******************/
BlogPostsRouter.get("/", async (req, res, next) => {
  try {
    const allPosts = await blogPostsModel.find();

    res.send(allPosts);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

/****************GET SINGLE POST******************/
BlogPostsRouter.get("/:id", async (req, res, next) => {
  try {
    const singlePost = await blogPostsModel.findById(req.params.id);
    // .populate("author");
    // const singlePosts = await blogPostsModel.findOne(${mongo query})

    if (singlePost) {
      res.send(singlePost);
    } else {
      next(createError(404, `Post ${req.params.id} not found `));
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

/****************UPDATE POST******************/
BlogPostsRouter.put("/:id", async (req, res, next) => {
  try {
    const singlePost = await blogPostsModel.findByIdAndUpdate(req.params.id, req.body, { runValidators: true, new: true });

    res.send(singlePost);
  } catch (error) {
    next(error);
  }
});

/****************DELETE POST******************/
BlogPostsRouter.delete("/:id", async (req, res, next) => {
  try {
    const singlePost = await blogPostsModel.findByIdAndDelete(req.params.id);

    if (singlePost) {
      res.status(204).send();
    }
  } catch (error) {
    next(error);
  }
});

/****************Download pdf******************/
BlogPostsRouter.get("/pdfDownload", async (req, res, next) => {
  try {
    const blogPosts = await getPosts();
    const source = generatePDFStream(blogPosts);
    const destination = res;
    res.setHeader("Content-Disposition", "attachment; filename=export.pdf");
    pipeline(source, destination, (err) => next(err));
  } catch (error) {
    next(error);
  }
});
/******************************Download pdf******************************************/
BlogPostsRouter.get("/pdftocsv", async (req, res, next) => {
  try {
    await generatePDF();

    res.send("generated");
  } catch (error) {
    next(error);
  }
});

/***************************Download csv**********************************************/
BlogPostsRouter.get("/csvDownload", async (req, res, next) => {
  try {
    const fields = ["_id", "category", "title", "cover"];
    const options = { fields };
    const jsonToCsv = new Transform(options);
    const source = getPostsSource();
    res.setHeader("Content-Disposition", "attachment; filename=export.csv");
    pipeline(source, jsonToCsv, res, (err) => next(err)); // source (file on disk) -> transform (json 2 csv) -> destination (rsponse)
  } catch (error) {
    next(error);
  }
});

/****************UPLOAD COVER******************/
BlogPostsRouter.post("/:id/uploadCove", multer().single("cover"), async (req, res, next) => {
  try {
    console.log(req.file);
    await writePostCover(req.file.originalname, req.file.buffer);
    const link = `http://localhost:3001/img/cover/${req.file.originalname}`;

    const Posts = await getPosts();
    let updatedPosts = Posts.map((post) => {
      if (post._id === req.params.id) {
        post.cover = link;
      }
      return post;
    });
    await writePosts(updatedPosts);
    res.status(201).send(link);
  } catch (error) {
    next(error);
  }
});
/****************UPLOAD COVER USING CLOUDINARY******************/
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Strive",
  },
});

const upload = multer({ storage: cloudinaryStorage }).single("cover");

BlogPostsRouter.post("/:id/uploadCover", upload, async (req, res, next) => {
  try {
    console.log(req.file);
    const Posts = await getPosts();
    let updatedPosts = Posts.map((post) => {
      if (post._id === req.params.id) {
        post.cover = req.file.path;
        console.log(post.cover);
      }
      return post;
    });
    await writePosts(updatedPosts);
    res.send(req.file.path);
  } catch (error) {
    next(error);
  }
});

/****************POST BLOGPOSTS COMMENTS******************/

BlogPostsRouter.post("/:id", async (req, res, next) => {
  try {
    const singlePost = await blogPostsModel.findById(req.params.id);
    const newComment = { ...req.body, date: new Date() };
    console.log(newComment);
    if (newComment) {
      await blogPostsModel.findByIdAndUpdate(req.params.id, { $push: { comments: newComment } }, { runValidators: true, new: true });
      res.send(singlePost);
    }
  } catch (error) {
    next(error);
  }
});

/****************GET ALL COMMENTS FOR A SPECIFIED POST******************/

BlogPostsRouter.get("/:id/comments", async (req, res, next) => {
  try {
    const commentsById = await blogPostsModel.findById(req.params.id, { comments: 1 });
    if (commentsById) {
      res.send(commentsById);
    } else {
      next(createError(404, `Post ${req.params.id} has no comments `));
      // createError(err.status, error.message)
    }
  } catch (error) {
    next(error);
  }
});

/****************GET SINGLE COMMENT FOR A SPECIFIED POST******************/

BlogPostsRouter.get("/:id/comments/:commentId", async (req, res, next) => {
  try {
    const singlecommentById = await blogPostsModel.findOne({ _id: req.params.id }, { comments: { $elemMatch: { name: req.params.commentId } } });
    if (singlecommentById) {
      res.send(singlecommentById);
    } else {
      next(createError(404, `comment ${req.params.commentId} not found `));
      // createError(err.status, error.message)
    }
  } catch (error) {
    next(error);
  }
});

/****************UPDATE COMMENT FOR A SPECIFIED POST******************/

BlogPostsRouter.put("/:id/comments/:commentId", async (req, res, next) => {
  try {
    const commentsById = await blogPostsModel.findOneAndUpdate(
      { _id: req.params.id, "comments._id": req.params.commentId },
      { $set: { "comments.$": req.body } }, // comments.$ is a positional ooperator that kelps to know what particular comment is targeted
      { runValidators: true, new: true }
    );
    if (commentsById) {
      res.send(commentsById);
    } else {
      next(createError(404, `comment ${req.params.commentId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

/****************DELETE COMMENT FOR A SPECIFIED POST******************/

BlogPostsRouter.delete("/:id/comments/:commentId", async (req, res, next) => {
  try {
    await blogPostsModel.findByIdAndUpdate(req.params.id, { $pull: { comments: { _id: req.params.commentId } } }, { new: true });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default BlogPostsRouter;
