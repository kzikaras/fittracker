const Sequelize = require('sequelize');
const Member = {
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
    },
    weight: {
        type: Sequelize.STRING
    }
};

module.exports = Member;