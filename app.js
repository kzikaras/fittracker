const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const methodOverride = require("method-override");
const Sequelize = require("sequelize");
const session = require("express-session");
const handlebars = require("express-handlebars");
const bodyParser = require("body-parser");
const member = require("./models/Member");
const workout = require("./models/Workout");
const weight = require("./models/Weight");

// DB setup
if (process.env.NODE_ENV === "production") {
  // the application is executed on Render.com ... use the postgres database
  db = new Sequelize(
    "postgresql://bbhybrid_user:eHhqhNjuTmyAQGTVvcTwf5ibihOHQrIv@dpg-ctmsust2ng1s73bfe7i0-a/bbhybrid",
    {
      dialect: "postgres",
      protocol: "postgres",
      port: 5432,
      host: "dpg-ctmsust2ng1s73bfe7i0-a",
      logging: true, //false
    }
  );
} else {
  // the application is executed on the local machine ... use local db
  db = new Sequelize("bbhybrid", "postgres", "Halothedog123", {
    host: "localhost",
    dialect: "postgres",
    operatorsAliases: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

//import routes
const members = require("./routes/members");
const workouts = require("./routes/workouts");

const Member = db.define("member", member, {
  timestamps: false,
  underscored: true,
});
const Workout = db.define("workout", workout, {
  timestamps: false,
  underscored: true,
});
const Weight = db.define("weight", weight, {
  timestamps: false,
  underscored: true,
});

Member.hasMany(Workout);

db.authenticate()
  .then(() => console.log("DB Connected"))
  .catch((err) => console.log(err));

// Middleware
app.engine("handlebars", handlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.set("trust proxy", true);
app.use(express.static("static"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "otisman",
  })
);
//Method override for allowing put requests from forms
app.use(methodOverride("_method"));

app.get("/", (req, res) => {
  if (req.session.member) {
    Weight.findAll({
      limit: 1,
      where: { member_id: req.session.member.id },
      order: [["date", "DESC"]],
    }).then((weight) => {
      if (weight.length) {
        req.session.member.weight = weight[0].dataValues.weight;
      } else {
        req.session.member.weight = "";
      }
      res.render("dashboard", {
        workouts: req.session.workouts,
        member: req.session.member,
        weight: req.session.member.weight,
      });
    });
  } else {
    res.render("index");
  }
});

// TODO add weight history edit
app.post("/update_weight", (req, res) => {
  return Weight.create({
    weight: req.body.weight,
    member_id: req.session.member.id,
  }).then((weight) => {
    if (weight) {
      req.session.member.weight = weight;
      res.render("dashboard", {
        workouts: req.session.workouts,
        member: req.session.member,
      });
    } else {
      res.status(400).send("Error adding weight");
    }
  });
  // .
  //     // catch((err) => {
  //     //     res.render('error_page', { error: err });
  //     // });
});

app.get("/about", (req, res) => {
  res.render("about");
});

// Point to routes
app.use("/members", members);
app.use("/workouts", workouts);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  db.sync();
  console.log(`Listening on port ${port}`);
});
