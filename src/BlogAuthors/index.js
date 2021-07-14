import express from "express"; // third party module(needs to ne installed)
import createError from "http-errors";
import { basicAuthMiddleware } from "../auth/basic.js";
import { adminOnlyMiddleware } from "../auth/admin.js";
import { JWTAuthMiddleware } from "../auth/jwt.js";
import { JWTAuthenticate } from "../auth/tools.js";

import { validationResult } from "express-validator";
import multer from "multer";
import { generatePDFStream } from "../lib/pdf.js";
import { pipeline } from "stream";
import { Transform } from "json2csv";
import authorsModel from "./schema.js";

const authorsRouter = express.Router();



authorsRouter.post("/register", async (req, res, next) => {
  try {
    const newAuthor = new authorsModel(req.body);

    const mongoRes = await newAuthor.save();
    res.status(201).send(mongoRes);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

authorsRouter.get("/", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const authors = await authorsModel.find();
    res.send(authors);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

authorsRouter.get("/me", JWTAuthMiddleware, async (req, res) => {
  try {
    res.send(req.author);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

/****************UPDATE Author******************/
authorsRouter.put("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    // modify the author with the fields coming from req.body

    req.author.name = "Whatever";

    await req.author.save();
  } catch (error) {
    next(error);
  }
});

/****************DELETE Author******************/
authorsRouter.delete("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    await req.author.deleteOne();
  } catch (error) {
    next(error);
  }
});

authorsRouter.post("/login", async (req, res, next) => {
  try {
    // 1. Verify credentials
    // 2. Generate token if credentials are ok
    // 3. Send token as a response


    const { email, password } = req.body;
    const author = await authorsModel.checkCredentials(email, password);
    if (author) {
      const accessToken = await JWTAuthenticate(author);
      res.send({ accessToken });
    } else {
      next(createError(401));
    }
  } catch (error) {
    next(error);
  }
});

/****************Download csv******************/
authorsRouter.get("/csvDownload", async (req, res, next) => {
  try {
    const fields = ["_id", "name", "surname", "email", "Date of Birth"];
    const options = [fields];
    const jsonToCsv = new Transform(options);
    const source = getAuthorsSource();
    res.setHeader("Content-Disposition", "attachment; filename=export.csv");
    pipeline(source, jsonToCsv, res, (err) => next(err)); // source (file on disk) -> transform (json 2 csv) -> destination (rsponse)
  } catch (error) {
    next(error);
  }
});

export default authorsRouter;
