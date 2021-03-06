var express = require('express');
var router = express.Router();

var Modem = require('../model/modem');
var Command = require('../model/command');
var User = require('../model/user');
var Values = require('../model/values');


router.get('/modem', function (req,res) {
    console.log("New request from " + req.query.imei);
    console.log("Type " + req.query.alarm)
    Modem.findOne({imei : req.query.imei, isAttached : true}, function (err,data) {

        if(err)
            throw err;
        if(data)
        {
            Values.findOne({}, function (err,data) {
                if(err)
                    throw err;
                if(!data)
                {
                    console.log("!DATA");
                    var values = new Values();
                    values.data.imei = req.query.imei;
                    values.data.motion1 = req.query.motion1;
                    values.data.motion2 = req.query.motion2;
                    values.data.hall = req.query.hall;
                    values.data.prox = req.query.prox;
                    values.data.sound = req.query.sound;

                    if(req.query.alarm == 1)
                    {
                        values.data.alarm.isAlarm = true;
                        values.data.alarm.sensor = req.query.sensor;
                    }
                    else
                    {
                        values.data.alarm.isAlarm = false;
                        values.data.alarm.sensor = null;
                    }
                    values.save();

                }
                else
                {
                    Values.updateOne({'data.imei':req.query.imei}, {'data.alarm.isAlarm' : req.query.alarm,
                        'data.alarm.sensor': req.query.sensor,
                        'data.motion1':req.query.motion1,
                        'data.motion2':req.query.motion2,
                        'data.hall':req.query.hall,
                        'data.prox':req.query.prox,
                        'data.sound':req.query.sound}, function (err, update) {
                    });
                }
                console.log("CMD : " + req.query.cmd);
                console.log("Values was added");
            });



            if(req.query.cmd != 0)
            {
                Command.findOne({'command.imei':req.query.imei,'command.isCommandExecute':true,
                    'command.isComplete':false}, function (err,data) {
                    if(err)
                        throw err;
                    if(data)
                    {
                        data.command.isComplete = true;
                        data.command.cmdresp = req.query.cmd;
                        data.save();
                        console.log("CMD save response : " + req.query.cmd);
                        console.log("END HERE 1");
                        return res.json({'cmd':0});
                    }
                    else
                    {
                        console.log("END HERE 2");
                        return res.json({'cmd':0});
                    }

                });
            }
            else
            {
                console.log("CMD start check new command : " + req.query.cmd);
                Command.findOne({'command.imei':req.query.imei, 'command.isCommandExecute':false}, function (err,data) {
                    if(err)
                        throw err;
                    if(data)
                    {
                        console.log(data);
                        data.command.isCommandExecute = true;
                        data.save();
                        console.log("CMD send command : " + data.command.cmd);
                        console.log("END HERE 3");
                        return res.json({'cmd':data.command.cmd});
                    }
                    else
                    {
                        console.log("END HERE 4");
                        return res.json({'cmd':0});

                    }
                });
            }

        }



        else
        {
            console.log("Modem : " + req.query.imei +" is not attached");
            console.log("END HERE 5");
            return res.json({'cmd':0})
        }
    });
});


router.post('/sendCommand', function (req, res) {
    var response;
    Command.findOne({'command.username' : req.body.username}, function (err, data) {
        if(err)
            throw err;
        else
        {
            if(!data)
            {
                var command = new Command();
                command.command.username = req.body.username;
                command.command.imei = req.body.imei;
                command.command.cmd = req.body.cmd;
                command.command.isCommandExecute = false;
                command.command.isComplete = false;
                command.save();
                response = res.json({"cmd":"ok"});
            }
            else
            {

                Command.updateOne({'command.username':req.body.username, 'command.imei':req.body.imei}, {'command.cmd' : req.body.cmd,
                'command.isCommandExecute' : false, 'command.isComplete': false, 'command.cmdresp' : 'null'}, function (err, update) {
                    if(err)
                        throw err;
                    else
                    {
                        if(update)
                            response = res.json({"cmd":"ok"});
                        else
                            response = res.json({"cmd":"not ok"});
                    }
                })
            }
        }
    });

    return response;
});


router.get('/readModemResponse', function (req, res) {
    Command.findOne({'command.imei':req.query.imei, 'command.isCommandExecute':
            true,
        'command.isComplete':true}, function (err, data) {
        if(err)
            throw err;
        if(data)
        {
            if (data.command.cmdresp == 'undefined')
                return res.send({"code":"404","response":"Произошла ошибка. " +
                    "Попробуйте позже"});
            else
                return res.send({"code":"200","response":data.command.cmdresp});
        }
        else
            return res.send({"code":"201","response":"Запрос еще не обработан модемом"});
    });
});


router.get('/getAlarmStatus', function (req, res) {
    Values.findOne({'data.alarm.isAlarm' : true}, function (err, data) {
        if(err)
            throw err;
        if(data)
        {
            res.send({"code":200, "response" : data.data.alarm.sensor});
            data.data.alarm.isAlarm = false;
            data.data.alarm.sensor = "null";
            data.save();
        }
        else
        {
            res.send({"code":201, "response" : "Все спокойно"});
        }
    })
});

module.exports = router;
