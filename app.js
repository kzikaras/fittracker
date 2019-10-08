const express = require('express');
const app = express();
const Sequelize = require('sequelize');
const session = require('express-session');
const port = 3000;
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const flash = require('express-flash');
const member = require('./models/Member');
const workout = require('./models/Workout');

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

app.get('/', (req, res) => {
    if (req.session.member) {
        res.render('dashboard', { workouts: req.session.workouts });
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
                            workout = String(workout.date);
                            edited_workouts.push(workout);
                        });
                        req.session.workouts = edited_workouts;
                        res.render('dashboard', { workouts: workouts });
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
        password: req.body.password
    }).then((member) => {
        if (member) {
            req.session.member = member;
            Workout.findAll({ where: { memberId: member.id } })
                .then((workouts) => {
                    req.session.workouts = workouts;
                    res.render('dashboard', { workouts: workouts });
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
            res.render('dashboard', { workouts: req.session.workouts });
        } else {
            res.status(400).send('Error adding workout');
        }
    }).
        catch((err) => {
            res.render('error_page', { error: err });
        });
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.listen(port, () => {
    db.sync();
    console.log(`Listening on port ${port}`);
});
