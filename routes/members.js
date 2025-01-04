const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const Sequelize = require("sequelize");
const member = require("../models/Member");
const workout = require("../models/Workout");
const weight = require("../models/Weight");

// TODO - refactor everything to use async/await

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
  console.log("Running local DB");
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

router.use(express.static("static"));

router.post("/login", (req, res) => {
  // TODO: make more robust
  Member.findOne({ where: { email: req.body.login_email } }).then((member) => {
    if (!member) {
      console.log("No member found");
      error = "User not found";
      res.render("index", { error: error });
      return;
    }
    bcrypt.compare(req.body.login_password, member.password, (err, resp) => {
      if (resp === true) {
        req.session.member = member;
        Workout.findAll({
          where: { memberId: member.id },
          order: [["date", "DESC"]],
        }).then((workouts) => {
          edited_workouts = [];
          workouts.forEach((workout) => {
            workout.date = String(workout.date);
            edited_workouts.push(workout.dataValues);
          });
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
            req.session.workouts = edited_workouts;
            console.log(req.session.workouts);
            res.render("dashboard", {
              workouts: req.session.workouts,
              member: req.session.member,
              weight: req.session.member.weight,
            });
          });
        });
      } else {
        if (resp === false) error = "Incorrect Password";
        res.render("index", { error: error });
      }
    });
  });
});

router.post("/signup", async (req, res) => {
  let existing_member = await Member.findOne({
    where: { email: req.body.email },
  });
  if (existing_member) {
    res.render("index", { error: "User already exists" });
    return;
  }
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    console.log(hash);
    Member.create({
      email: req.body.email,
      username: req.body.username,
      password: hash,
    }).then((member) => {
      console.log("found member: ", member);
      if (member) {
        req.session.member = member;
        Workout.findAll({ where: { memberId: member.id } }).then((workouts) => {
          console.log("in workouts route");
          req.session.workouts = workouts;
          res.render("dashboard", {
            workouts: req.session.workouts,
            member: req.session.member,
          });
        });
      } else {
        res.status(400).send("Error signing up");
      }
    });
  });
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.render("index");
});

router.post("/update_profile", (req, res) => {
  Member.findOne({ where: { email: req.session.member.email } }).then(
    (member) => {
      member.update({
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
      });
      res.render("dashboard", {
        workouts: req.session.workouts,
        member: req.session.member,
      });
    }
  );
});

module.exports = router;
