const Sequelize = require('sequelize');
const Workout = {
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
    },
    calories_burned: {
        type: Sequelize.INTEGER
    },
    duration: {
        type: Sequelize.FLOAT
    },
    weight_notes: {
        type: Sequelize.STRING
    },
    date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    }
};
module.exports = Workout;