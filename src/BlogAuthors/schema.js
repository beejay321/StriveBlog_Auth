import mongoose from "mongoose";
import bcrypt from "bcrypt";
const { Schema, model } = mongoose;

const authorsSchema = new Schema(
  {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    position: { type: String, required: true, enum: ["Admin", "Author"] },
    // DateofBirth: { type: String },
    //   required: true,
  },
  { timestamps: true }
);

authorsSchema.pre("save", async function (next) {
  const newAuthor = this;
  console.log(newAuthor);
  const plainPw = newAuthor.password;
  if (newAuthor.isModified("password")) {
    newAuthor.password = await bcrypt.hash(plainPw, 10);
  } else {
    next();
  }
});

authorsSchema.methods.toJSON = function () {
  const author = this;
  const authorObject = author.toObject();
  delete authorObject.password;
  delete authorObject.__v;
  return authorObject;
};

authorsSchema.statics.checkCredentials = async function (email, plainPw) {
  // 1. find author in db by email
  const author = await this.findOne({ email });
  if (author) {
    // 2. compare plainPw with hashed pw
    const hashedPw = author.password;
    const isMatch = await bcrypt.compare(plainPw, hashedPw);

    // 3. return a meaningful response

    if (isMatch) return author;
    else return null;
  } else {
    return null;
  }
};

authorsSchema.post("validate", function (error, doc, next) {
  if (error) {
    const err = createError(400, error);
    next(err);
  } else {
    next();
  }
});

export default model("author", authorsSchema);

// ********Token generating*************
// node
// Welcome to Node.js v14.16.0.
// Type ".help" for more information.
// > require("crypto").randomBytes(64).toString("hex")
