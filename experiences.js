import express from "express"; // third party module(needs to ne installed)
import experienceModel from "./schema.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { Transform } from "json2csv";

// import { validationResult } from "express-validator";
// import createError from "http-errors";
// import { blogPostsValidation } from "./validation.js";
// import { generatePDFStream } from "../lib/pdf.js";
// import { pipeline } from "stream";

const ExperienceRouter = express.Router();

/****************POST Experience******************/

ExperienceRouter.post("/:userName/experiences", async (req, res, next) => {
  try {
    // const user = await userModel.findById()

    const newExperience = new experienceModel(req.body);
    const mongoRes = await newExperience.save();
    res.status(201).send(mongoRes);
  } catch (error) {
    next(error);
  }
});
/****************UPLOAD COVER USING CLOUDINARY******************/
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "Strive-linkedIn",
  },
});

const upload = multer({ storage: cloudinaryStorage }).single("image");

ExperienceRouter.post("/:userName/experiences/:expId/picture", upload, async (req, res, next) => {
  try {
    console.log(req.file);
    console.log(req.file.path);
    const experience = await experienceModel.findById(req.params.expId);
    experience.image = req.file.path;
    await experience.save();

    res.send(req.file.path);
  } catch (error) {
    next(error);
  }
});


/***************************Download csv**********************************************/
ExperienceRouter.get("/:userName/experiences/CSV", async (req, res, next) => {
  try {
    const fields = ["_id", "role", "company", "startDate","endDate", "description", "area"];
    const options = { fields };
    const jsonToCsv = new Transform(options);
    const source = getPostsSource();
    res.setHeader("Content-Disposition", "attachment; filename=export.csv");
    pipeline(source, jsonToCsv, res, (err) => next(err)); // source (file on disk) -> transform (json 2 csv) -> destination (response)
 

  } catch (error) {
    next(error);
  }
});

/****************GET EXPERIENCES******************/
ExperienceRouter.get("/:userName/experiences", async (req, res, next) => {
  try {
    const allExperiences = await experienceModel.find({}, { updatedAt: 0, createdAt: 0 }).populate("username", { name: 1, surname: 1, _id: 0 });

    res.send(allExperiences);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

/****************GET SPECIFIC EXPERIENCES******************/
ExperienceRouter.get("/:userName/experiences/:expId", async (req, res, next) => {
  try {
    const singleExp = await experienceModel.findById(req.params.expId);
    if (singleExp) {
      res.send(singleExp);
    } else {
      res.status(404).send_(`Not found `);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

/****************UPDATE EXPERIENCES******************/
ExperienceRouter.put("/:userName/experiences/:expId", async (req, res, next) => {
  try {
    const updatedExp = await experienceModel.findByIdAndUpdate(req.params.id, req.body, { runValidators: true, new: true });
    res.send(updatedExp);
  } catch (error) {
    next(error);
  }
});

/****************DELETE EXPERIENCE******************/
ExperienceRouter.delete("/:userName/experiences/:expId", async (req, res, next) => {
  try {
    const deletedExp = await experienceModel.findByIdAndDelete(req.params.id);
    if (deletedExp) {
      res.status(204).send();
    }
  } catch (error) {
    next(error);
  }
});

export default ExperienceRouter;
