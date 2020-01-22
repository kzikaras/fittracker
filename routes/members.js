const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const Sequelize = require('sequelize');
const member = require('../models/Member');
const workout = require('../models/Workout');
const weight = require('../models/Weight');

// DB setup
if (process.env.NODE_ENV === 'production') {
    console.log('Found heroku db');
    // the application is executed on Heroku ... use the postgres database
    db = new Sequelize('postgres://ygmuefqwcpoqoz:eb355d03a4031d388c1fe54753d014373efb212fb5ad10fdbdaccd1e00dcaaef@ec2-54-235-96-48.compute-1.amazonaws.com:5432/d6tsfbs6l4h3im'
        , {
        dialect:  'postgres',
        protocol: 'postgres',
        port:     5432,
        host:     'ec2-54-235-96-48.compute-1.amazonaws.com',
        logging:  true //false
    })
} else {
    console.log('Running local DB');
    // the application is executed on the local machine ... use local db
    db = new Sequelize('bbhybrid', 'postgres', 'Halothedog123', {
        host: 'localhost',
        dialect: 'postgres',
        operatorsAliases: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
}

const Member = db.define('member', member, {
    timestamps: false,
    underscored: true
});
const Workout = db.define('workout', workout, {
    timestamps: false,
    underscored: true
});
const Weight = db.define('weight', weight, {
    timestamps: false,
    underscored: true
});

Member.hasMany(Workout);

router.post('/login', (req, res) => {
    // TODO: make more robust
    Member.findOne({ where: { email: req.body.login_email } })
    .then((member) => {
        if(!member) {
            console.log('No member found');
            res.render('index');
            return;
        }
        bcrypt.compare(req.body.login_password, member.password, (err, resp) => {
            if (resp === true) {
                req.session.member = member;
                Workout.findAll({
                    where: { memberId: member.id },
                    order: [['date', 'DESC']]
                })
                .then((workouts) => {
                    edited_workouts = [];
                    workouts.forEach((workout) => {
                        workout.date = String(workout.date);
                        edited_workouts.push(workout);
                    });
                    Weight.findAll({
                        limit: 1,
                        where: { member_id: req.session.member.id },
                        order: [['date', 'DESC']]
                    }).then((weight) => {
                        if (weight.length) {
                            req.session.member.weight = weight[0].dataValues.weight;
                        } else {
                            req.session.member.weight = '';
                        }
                        req.session.workouts = edited_workouts;
                        res.render('dashboard', {
                            workouts: req.session.workouts,
                            member: req.session.member,
                            weight: req.session.member.weight   
                        });
                    });
                });
            } else {
                // TODO flash a message that the login failed
                console.log(err);
                res.render('index');
            }
        });
    });
});

// TODO verify a user doesnt exist before creating
router.post('/signup', (req, res) => {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
        console.log(hash);
        return Member.create({
            email: req.body.email,
            username: req.body.username,
            password: hash
        }).then((member) => {
            if (member) {
                req.session.member = member;
                Workout.findAll({ where: { memberId: member.id } })
                    .then((workouts) => {
                        req.session.workouts = workouts;
                        res.render('dashboard', {
                            workouts: req.session.workouts,
                            member: req.session.member
                        });
                    });
            } else {
                res.status(400).send('Error signing up');
            }
        });
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.render('index');
});

router.post('/update_profile', (req, res) => {
    Member.findOne({ where: { email: req.session.member.email } })
        .then((member) => {
            member.update({
                email: req.body.email,
                username: req.body.username,
                password: req.body.password
            });
            res.render('dashboard', {
                workouts: req.session.workouts,
                member: req.session.member
            });
        });
});

module.exports = router; 