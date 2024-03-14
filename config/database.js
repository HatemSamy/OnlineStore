
// dbconnection.js
const sql = require('mssql');
const mongoose = require('mongoose');
const fs = require('fs/promises');


// Function to read configuration from dbconfig.json file
const readConfig = async function () {
  try {
    const configFile = await fs.readFile('dbconfig.json', 'utf8');
    return JSON.parse(configFile);
  } catch (error) {
    console.error('Error reading configuration file:', error);
    throw error;
  }
};

// Function to establish connection to the database
const connectAndQuery = async function () {
  const config = await exports.readConfig();
  try {
    const connection = await sql.connect(config);
    console.log('Connected to SQL Server');
    return connection;
  } catch (error) {
    console.error('Error connecting to SQL Server:', error.message);
    throw error;
  }
};

// Function to check if configuration has changed and update dbconfig.json
const updateConfigIfNeeded = async function (newConfig) {
  return exports.readConfig().then(function (currentConfig) {
    if (JSON.stringify(newConfig) !== JSON.stringify(currentConfig)) {
      return fs.writeFile('dbconfig.json', JSON.stringify(newConfig, null, 2)).then(function () {
        console.log('Configuration updated:', newConfig);
      }).catch(function (error) {
        console.error('Error updating configuration:', error);
        throw error;
      });
    }
  }).catch(function (error) {
    console.error('Error updating configuration:', error);
    throw error;
  });
};

const parseTime = function (time) {
  const [timeStr, period] = time.split(' ');
  const [hours, minutes] = timeStr.split(':').map(function (str) {
    return parseInt(str);
  });
  let hour = hours;
  if (period.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }
  const date = new Date();
  date.setHours(hour, minutes, 0, 0); // Set hours, minutes, seconds, and milliseconds
  return date; // Return the Date object
};

const convertToCronPattern = function (time) {
  const timeStr = time.toString(); // Convert time to string

  console.log('Received time:', timeStr);

  // Use regex to extract hour, minute, and period
  const match = timeStr.match(/(\d{1,2}):(\d{2}) (AM|PM)/);
  if (!match) {
    console.error('Invalid time format:', timeStr);
    return null;
  }

  const hour = parseInt(match[1]);
  const minute = parseInt(match[2]);
  const period = match[3];

  // Adjust hours for PM
  const adjustedHour = period.toUpperCase() === 'PM' && hour !== 12 ? hour + 12 : hour;

  // Construct and return the cron pattern
  return `${minute} ${adjustedHour} * * *`;
};





const connectDB = async function () {
  return await mongoose.connect(process.env.DB_URI)
    .then(function (res) {
      return console.log(`DB Connected successfully on .........${process.env.DB_URI}`);
    })
    .catch(function (err) {
      return console.log(" Fail to connect  DB.........".concat(err, " "));
    });
};

exports.connectDB = connectDB;
exports.sql = sql;
exports.connectAndQuery = connectAndQuery;
exports.readConfig = readConfig;
exports.parseTime = parseTime;

exports.updateConfigIfNeeded = updateConfigIfNeeded;



