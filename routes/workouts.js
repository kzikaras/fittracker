const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const Sequelize = require("sequelize");
const member = require("../models/Member");
const workout = require("../models/Workout");
const weight = require("../models/Weight");

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

router.post("/add_workout", (req, res) => {
  Workout.create({
    name: req.body.workout_name,
    program: req.body.workout_program,
    duration: req.body.duration,
    calories_burned: req.body.calories_burned,
    memberId: req.session.member.id,
    weight_notes: req.body.weight_notes,
  })
    .then((workout) => {
      if (workout) {
        req.session.workouts.unshift(workout);
        let workouts = req.session.workouts;
        console.log(workouts);
        res.render("dashboard", {
          workouts: workouts,
          member: req.session.member,
        });
      } else {
        res.status(400).send("Error adding workout");
      }
    })
    .catch((err) => {
      res.render("error_page", { error: err });
    });
});

router.get("/show_update_workout/:workout_id", (req, res) => {
  Workout.findOne({ where: { id: req.params.workout_id } }).then((workout) => {
    res.render("update_weight", { workout: workout });
  });
});

router.post("/update_workout/:workout_id", (req, res) => {
  Workout.findOne({ where: { id: req.params.workout_id } }).then((workout) => {
    let new_workout = {
      name: req.body.workout_name,
      program: req.body.workout_program,
      duration: req.body.duration,
      calories_burned: req.body.calories_burned,
      memberId: req.session.member.id,
      weight_notes: req.body.weight_notes,
    };
    workout.update(new_workout);
    for (let i = 0; i < req.session.workouts.length; i++) {
      if (req.session.workouts[i].id == req.params.workout_id) {
        req.session.workouts[i] = new_workout;
      }
    }
    res.render("dashboard", {
      workouts: req.session.workouts,
      member: req.session.member,
    });
  });
});

router.delete("/delete_workout/:workout_id", (req, res) => {
  Workout.destroy({ where: { id: req.params.workout_id } }).then((workout) => {
    req.session.workouts.splice(req.session.workouts.indexOf(workout));
    res.render("dashboard", {
      workouts: req.session.workouts,
      member: req.session.member,
    });
  });
});

module.exports = router;
