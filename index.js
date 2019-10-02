const express = require('express');
const app = express();
const Sequelize = require('sequelize');
const port = 3000;
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');

//TODO: cleanup all temp_session refs once real session is implemented
let temp_session = {};

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
// TODO: move models to another file
//models
const Workout = db.define('workout', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING
    },
    program: {
        type: Sequelize.STRING
    }
}, {
        timestamps: false,
        underscored: true
    });

const Member = db.define('member', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: Sequelize.STRING
    },
    username: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    }
}, {
        timestamps: false,
        underscored: true
    });

Member.hasMany(Workout);

db.authenticate()
    .then(() => console.log('DB Connected'))
    .catch(err => console.log(err));

// Handlebars middleware
app.engine('handlebars', handlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/login', (req, res) => {
    // TODO: make more robust and add session
    Member.findOne({ where: { email: req.body.login_email } })
        .then((member) => {
            temp_session.member = member;
            if (req.body.login_password === member.password) {
                Workout.findAll({ where: { memberId: member.id } })
                    .then((workouts) => {
                        temp_session.member.workouts = workouts;
                        console.log(temp_session.member.id);
                        console.log(temp_session.member.workouts)
                        res.render('dashboard', { workouts: workouts });
                    });
            } else {
                res.render('index');
            }
        }).catch((err) => {
            console.log(err);
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
            res.render('index', { member: member });
        } else {
            res.status(400).send('Error signing up');
        }
    });
});

app.post('/add_workout', (req, res) => {
    console.log(req.body.workout_name);
    console.log(req.body.workout_program);
    console.log(temp_session.member.id);
    return Workout.create({
        name: req.body.workout_name,
        program: req.body.workout_program,
        member_id: temp_session.member.id
    }).then((workout) => {
        if (workout) {
            temp_session.member.workouts.push(workout);
            res.render('dashboard', { workouts: temp_session.member.workouts });
        } else {
            res.status(400).send('Error adding workout');
        }
    });
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.listen(port, () => {
    db.sync();
    console.log(`Listening on port ${port}`);
});
