
const { syncOrdersToSQL, syncProductData } = require('./Data.synchronization');


const scheduledTasks = [];

// Function to parse time string into Date object
const parseTime = (timeString) => {
    const [hoursStr, minutesStr, period] = timeString.split(/\s+|:/);
    let hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);

    if (period.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
    }

    const currentTime = new Date();
    const time = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), hours, minutes, 0, 0);

    return time;
};


const handleSchedule = async (syncMethod, syncTime, startTime, endTime, syncInterval, now = false) => {
    console.log("Entering handleSchedule function...");
    console.log("Received parameters:");
    console.log("syncMethod:", syncMethod);
    console.log("syncTime:", syncTime);
    console.log("startTime:", startTime);
    console.log("endTime:", endTime);
    console.log("syncInterval:", syncInterval);
    console.log("now:", now);

    try {
        // Get the local time zone of the server or system
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        console.log("Detected local time zone:", userTimeZone);

        scheduledTasks.forEach(task => clearInterval(task));
        scheduledTasks.length = 0;

        switch (syncMethod) {
            case 'once':
                if (syncTime) {
                    // Parse the specified sync time
                    const [hoursStr, minutesStr, period] = syncTime.split(/\s+|:/);
                    let hours = parseInt(hoursStr);
                    const minutes = parseInt(minutesStr);

                    // Adjust hours for PM
                    if (period.toUpperCase() === 'PM' && hours !== 12) {
                        hours += 12;
                    } else if (period.toUpperCase() === 'AM' && hours === 12) {
                        hours = 0;
                    }

                    let syncDateTime = new Date();
                    syncDateTime.setHours(hours, minutes, 0, 0); // Set the hours and minutes

                    // Check if the specified time has already passed for today
                    const currentTime = new Date();
                    if (syncDateTime.getTime() < currentTime.getTime()) {
                        // If the specified time has passed, schedule for the same time on the next day
                        syncDateTime.setDate(syncDateTime.getDate() + 1);
                        syncDateTime.setHours(hours, minutes, 0, 0); // Reset to the specified time
                        console.log("Scheduled one-time synchronization moved to the next day at:", syncDateTime.toLocaleString('en-US', { timeZone: userTimeZone }));
                    }

                    const delayMs = syncDateTime.getTime() - Date.now();

                    const task = setTimeout(async () => {
                        await syncProductData();
                        await syncOrdersToSQL();
                        console.log('Performed one-time synchronization at:', new Date().toLocaleString('en-US', { timeZone: userTimeZone }));
                    }, delayMs);

                    scheduledTasks.push(task); // Push the task to the scheduledTasks array
                } else {
                    console.log('No synchronization time provided for one-time synchronization.');
                }
                break;

            case 'periodic':
                if (startTime && endTime) {
                    let startTimeObj = parseTime(startTime);
                    const endTimeObj = parseTime(endTime);

                    const currentTime = new Date();
                    if (startTimeObj < currentTime) {
                        startTimeObj = new Date(startTimeObj.getTime() + 24 * 60 * 60 * 1000);
                        console.log("Scheduled periodic synchronization start time moved to the next day at:", startTimeObj.toLocaleString('en-US', {
                            timeZone: userTimeZone
                        }));
                    }

                    schedulePeriodicSync(startTimeObj, endTimeObj, syncInterval, userTimeZone);

                    console.log('Scheduled periodic synchronization between', startTime, 'and', endTime, 'with an interval of', syncInterval);
                } else {
                    console.log('Incomplete parameters for periodic synchronization.');
                }
                break;

            case 'now':
                console.log('Performing one-time synchronization immediately.');

                // Perform one-time synchronization immediately
                await syncProductData();
                await syncOrdersToSQL();

                console.log('Performed one-time synchronization immediately.');
                break;

            default:
                console.log('Invalid synchronization method');
                break;
        }
    } catch (error) {
        console.error('Error handling synchronization:', error);
    }
};

// Function to schedule periodic synchronization
const schedulePeriodicSync = (startTime, endTime, syncInterval, userTimeZone) => {
    const intervalMs = syncInterval * 60 * 1000; // Convert syncInterval to milliseconds

    const task = setInterval(async () => {
        if (new Date() >= endTime) {
            clearInterval(task);
            console.log("Periodic synchronization completed as end time reached.");
            return;
        }

        await syncProductData();
        await syncOrdersToSQL();
        console.log('Performed periodic synchronization at:', new Date().toLocaleString('en-US', {
            timeZone: userTimeZone
        }));
    }, intervalMs);

    scheduledTasks.push(task);
};



module.exports = { handleSchedule };