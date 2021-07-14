import express from "express"
import { writePostCover, readPostCover } from "../lib/fs-tools.js"
import multer from "multer"
// import zlib from "zlib"

const filesRouter = express.Router()

filesRouter.post("/:id/uploadCover", multer().single("cover"), async (req, res, next) => {
    try {
  
    //   const blogPosts = await getPosts();
    //   const blogPost = blogPosts.find((a) => a._id === req.params.id);
  
  
      console.log(req.file)
      await writePostCover(req.file.originalname, req.file.buffer)
      res.send("ok")
    } catch (error) {
      console.log(error)
      next(error)
    }
  })
  // export default filesRouter