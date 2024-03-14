

const { readConfig ,updateConfigIfNeeded } = require('../config/database');

const { handleSchedule } = require('./handleSchedule');
const { syncOrdersToSQL, syncProductData } = require('./Data.synchronization');


exports.configureAndSync = async function (req, res) {
    console.log('Received request to configure and sync:', req.body);
  
    const {
      user,
      password,
      server,
      database,
      syncMethod,
      syncTime,
      startTime,
      endTime,
      syncInterval,
      wantSync
    } = req.body;
  
    try {
      // Read existing configuration from dbconfig.json or use the provided configuration
      const existingConfig = await readConfig();
  
      // Merge existing configuration with new user-provided values
      const newConfig = {
        user: user || existingConfig.user,
        password: password || existingConfig.password,
        server: server || existingConfig.server,
        database: database || existingConfig.database,
        options: {
          ...existingConfig.options
        }
      };
      await updateConfigIfNeeded(newConfig);
      if (wantSync) {
        console.log('Scheduling synchronization based on user preference...');
        await handleSchedule(syncMethod, syncTime, startTime, endTime, syncInterval, syncOrdersToSQL, syncProductData);
      } else {
        console.log('Synchronization is disabled by the user.');
      }
  
      console.log('Configuration saved and synchronization scheduled successfully.');
      res.status(200).json({
        message: 'Configuration saved and synchronization scheduled successfully'
      });
    } catch (error) {
      console.error('Error configuring and scheduling synchronization:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  };
