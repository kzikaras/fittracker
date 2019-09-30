const express = require('express');
const app = express();
const Sequelize = require('sequelize');
const port = 3000;
const handlebars = require('express-handlebars');

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
}, { timestamps: false });


db.authenticate()
    .then(() => console.log('DB Connected'))
    .catch(err => console.log(err));

// Test Data
user = {
    id: 1234,
    email: "kurtzikaras@gmail.com",
    entries: [
        {
            date: "12/23/19",
            time: 24,
            workout: "Running",
            feeling: "Good"
        },
        {
            date: "12/24/19",
            time: 34,
            workout: "Hiit",
            feeling: "OK"
        },
        {
            date: "12/24/19",
            time: 34,
            workout: "Hiit",
            feeling: "OK"
        },
        {
            date: "12/24/19",
            time: 34,
            workout: "Hiit",
            feeling: "OK"
        },
        {
            date: "12/24/19",
            time: 34,
            workout: "Hiit",
            feeling: "OK"
        }
    ]
}

// Handlebars middleware
app.engine('handlebars', handlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    Workout.findAll({ where: { id: 1 } })
        .then((workouts) => {
            res.render('dashboard', { workouts: workouts });
        }).catch((err) => {
            console.log(err);
        });
});

app.get('/about', (req, res) => {
    res.render('about');
});


app.listen(port, () => {
    db.sync();
    console.log(`Listening on port ${port}`);
});
