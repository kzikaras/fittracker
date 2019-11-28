const express = require('express');
const app = express();
const methodOverride = require('method-override');
const Sequelize = require('sequelize');
const session = require('express-session');
const port = 3000;
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const flash = require('express-flash');
const member = require('./models/Member');
const workout = require('./models/Workout');
const weight = require('./models/Weight');

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
        req.session.save(() => {
            console.log(req.session.id);
            console.log(req.sessionStore.sessions);
            res.render('dashboard', {
                workouts: req.session.workouts,
                member: req.session.member,
                current_weight: req.session.member.weights[0],
                weights: req.session.member.weights
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
            if (req.body.login_password === member.password) {
                req.session.member = member;
                Workout.findAll({ where: { memberId: member.id } })
                    .then((workouts) => {
                        edited_workouts = [];
                        workouts.forEach((workout) => {
                            workout.date = String(workout.date);
                            edited_workouts.push(workout);
                        });
                        Weight.findAll({
                            where: { member_id: req.session.member.id },
                            order: [['date', 'ASC']]
                        }).then((weight) => {
                            let weights = [];
                            console.log(weight.length);
                            for (i = 0; i < weight.length; i++) {
                                weights.push(weight[i].dataValues.weight);
                            }
                            if (weights.length > 7)
                                weights.shift();
                            let current_weight = weights[weights.length-1];
                            req.session.member.weights = weights;
                            req.session.workouts = edited_workouts;
                            console.log(req.session.id);
                            req.session.save(() => {
                                res.render('dashboard', {
                                    workouts: req.session.workouts,
                                    member: req.session.member,
                                    current_weight: current_weight,
                                    weights: req.session.member.weights
                                });
                            });
                        });
                    });
            } else {
                // TODO flash a message that the login was invalid
                res.render('index');
            }
        }).catch((err) => {
            res.render('error_page', { error: err });
        });
});

// TODO verify a user doesnt exist before creating
app.post('/signup', (req, res) => {
    return Member.create({
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        weight: ''
    }).then((member) => {
        if (member) {
            req.session.member = member;
            Workout.findAll({ where: { memberId: member.id } })
                .then((workouts) => {
                    req.session.workouts = workouts;
                    res.render('dashboard', {
                        workouts: req.session.workouts,
                        member: req.session.member,
                        weight: req.session.member.weight
                    });
                });
        } else {
            res.status(400).send('Error signing up');
        }
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
                member: req.session.member,
                weight: req.session.member.weight
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
                member: req.session.member,
                weight: req.session.member.weight.weight
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
                member: req.session.member,
                weight: req.session.member.weight
            });
        });
});

app.delete('/delete_workout/:workout_id', (req, res) => {
    Workout.destroy({ where: { id: req.params.workout_id } })
        .then((workout) => {
            req.session.workouts.splice(req.session.workouts.indexOf(workout));
            res.render('dashboard', {
                workouts: req.session.workouts,
                member: req.session.member,
                weight: req.session.member.weight
            });
        });
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.listen(port, () => {
    db.sync();
    console.log(`Listening on port ${port}`);
});
