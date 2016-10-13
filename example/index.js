var cl = console.log;
var Hapi = require('hapi');//Server Framework for Node.js
var Routes=require('./routes.js');
var osHelper = require('./helpers/osHelper.js');

var httpV4Server = new Hapi.Server();
httpV4Server.connection({
    host: osHelper.getServerIP(),
    port: 80,
    routes: {
        cors: true//Set to true to allow to be joined from web client
    }
});
var Server = httpV4Server;
Server.route(Routes.endpoints);

/*
 * We want to have some cron job
 */
var enabledCallback = function(job,scheduleParsed){console.log('Enabled job:', job.name, ".\n\t Scheduled:", job.schedule, '\n\t First Exec :'+scheduleParsed.firstExec+'\n\t Next exec:' + scheduleParsed.nextExec);};
Server.register({
    register:require('../'),//Replace with require('hapi-cron-job')
    options:{
        localTime:true,//Default is true, set False to GMT time TODO: default should be GTM time, and we allow to specify a timezone offset
        jobs:[            
            {
                name:"Backup",
                enabled:false,
                enabledCallback:enabledCallback,
                schedule:"every 1 hour",
                execute:require('./cron-jobs/backup.js').execute,
                environments:['development','staging']
            },
            {
                name:"diplay time",
                enabled:true,
                // enabledCallback:enabledCallback,
                schedule:"every 1 s",
                execute:require('./cron-jobs/displayTime.js').execute,
                environments:['development','staging']
            },
            {
                name:"diplay text",
                enabled:true,
                enabledCallback:enabledCallback,
                immediate:true,//Ask to an immediate execution of the fn
                schedule:"at 8:00 pm",
                execute:require('./cron-jobs/displayText.js').execute,
                environments:['development']
            },
            {
                name:"diplay stuff",
                enabled:true,
                enabledCallback:enabledCallback,
                schedule:"every plain min",
                execute:function(){console.log('stuff')},
                environments:['development','staging']
            }
        ],
        callback:function(enabledJobs){
            console.log('Enabled Jobs', enabledJobs);
        }
    }
}, function(err){
    if(err){throw err;}
});


Server.start(function(err){
    if(err){
        if (err.code == "EADDRINUSE" || err.code == "EACCES") {
            console.error(err); //As we handle this, we won't throw the error, so we might want to log it
            closeServer();
        }
        throw err;//Hapi will handle this (by displaying it)
    }
    cl('Started',Server.info.id,'on',Server.info.protocol+'://'+Server.info.host+':'+Server.info.port, 'Environment:'+process.env.NODE_ENV);
});

var closeServer = function(){
    process.exit(0);
};
process.on('SIGINT', function(){
    closeServer();
});