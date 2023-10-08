const path = require("path");
const express = require("express");
const cors = require("cors");
const favicon = require("serve-favicon");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "public", "views"));

app.use(
  favicon(
    path.join(__dirname, "..", "public", "static", "icons", "favicon.ico")
  )
);

app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.static(path.join(__dirname, "..", "public")));
var options = {
  index: false,
};
app.use(
  express.static(path.join(__dirname, "..", "public", "codenames"), options)
);

app.get("/", (req, res) => {
  res.redirect("/about");
});

app.get("/about", (req, res) => {
  res.render("pages/about");
});

app.get("/projects/codenames", (req, res) => {
  res.render("pages/codenames");
});
app.get("/codenames", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "public", "codenames", "codenames.html")
  );
});

// app.get("/projects/newproject", (req, res) => {
//   res.redirect("/about");
// });

// app.get("/contact", (req, res) => {
//   res.render("pages/contact");
// });

module.exports = app;
