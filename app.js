const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const Sequelize = require('sequelize');
const session = require('express-session');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const member = require('./models/Member');
const workout = require('./models/Workout');
const weight = require('./models/Weight');

// TODOS:
// 1. Move routes into seperate files using the router package


// DB setup
const db = new Sequelize('bbhybrid', 'postgres', 'Halothedog123', {
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

db.authenticate()
    .then(() => console.log('DB Connected'))
    .catch(err => console.log(err));

// Middleware
app.engine('handlebars', handlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('trust proxy', true);
app.use(express.static('static'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'otisman',
}));
//Method override for allowing put requests from forms
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
    if (req.session.member) {
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
            res.render('dashboard', {
                workouts: req.session.workouts,
                member: req.session.member,
                weight: req.session.member.weight
            });
        });
    } else {
        res.render('index');
    }
});

app.post('/login', (req, res) => {
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
                Workout.findAll({ where: { memberId: member.id } })
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
app.post('/signup', (req, res) => {
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

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.render('index');
});

app.post('/add_workout', (req, res) => {
    return Workout.create({
        name: req.body.workout_name,
        program: req.body.workout_program,
        duration: req.body.duration,
        calories_burned: req.body.calories_burned,
        memberId: req.session.member.id,
        weight_notes: req.body.weight_notes
    }).then((workout) => {
        if (workout) {
            req.session.workouts.push(workout);
            res.render('dashboard', {
                workouts: req.session.workouts,
                member: req.session.member
            });
        } else {
            res.status(400).send('Error adding workout');
        }
    }).
        catch((err) => {
            res.render('error_page', { error: err });
        });
});

// TODO add weight history edit
app.post('/update_weight', (req, res) => {
    return Weight.create({
        weight: req.body.weight,
        member_id: req.session.member.id
    }).then((weight) => {
        if (weight) {
            req.session.member.weight = weight;
            res.render('dashboard', {
                workouts: req.session.workouts,
                member: req.session.member
            });
        } else {
            res.status(400).send('Error adding weight');
        }
    })
    // .
    //     // catch((err) => {
    //     //     res.render('error_page', { error: err });
    //     // });
});

app.post('/update_profile', (req, res) => {
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

app.delete('/delete_workout/:workout_id', (req, res) => {
    Workout.destroy({ where: { id: req.params.workout_id } })
        .then((workout) => {
            req.session.workouts.splice(req.session.workouts.indexOf(workout));
            res.render('dashboard', {
                workouts: req.session.workouts,
                member: req.session.member
            });
        });
});

app.get('/about', (req, res) => {
    res.render('about');
});

const port = process.env.port || 3000;

app.listen(port, () => {
    db.sync();
    console.log(`Listening on port ${port}`);
});
