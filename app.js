import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { error } from "console";

mongoose
  .connect("mongodb://127.0.0.1:27017/", { dbname: "backend" })
  .then(() => console.log("databse connected"))
  .catch((error) => console.log(error));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema);

const app = express();

//using middlewares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
//setting up view engine with ejs for render the filef
app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    //decode token for verify the user

    const decoded = jwt.verify(token, "sshhpp");

    req.user = await User.findById(decoded._id);
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", isAuthenticated, (req, res) => {
  res.render("logout", { name: req.user.name });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });
  if (!user) res.redirect("/register");
  const ismatch = bcrypt.compare(password,user.password)
  if (!ismatch) return res.render("login", {email, message: "password mismatch" });

  //match ho jayega to user bnaao
  const token = jwt.sign({ _id: user._id }, "sshhpp");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  //same email se login na ho to islie find krege

  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }

  //use bcrypt for hash the password

  const hashedpassword = await bcrypt.hash (password,10)

  //mongodb me user create kar rhe
  user = await User.create({ name, email, password:hashedpassword });

  //jwt setup kie hai yha
  const token = jwt.sign({ _id: user._id }, "sshhpp");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.listen(3000, () => {
  console.log("server is running");
});
