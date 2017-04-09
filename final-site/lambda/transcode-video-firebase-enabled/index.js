/**
 * Created by Peter Sbarski
 * Updated by Mike Chambers
 * Last Updated: 1/02/2017
 *
 * Required Env Vars:
 * ELASTIC_TRANSCODER_REGION
 * ELASTIC_TRANSCODER_PIPELINE_ID
 * SERVICE_ACCOUNT
 * DATABASE_URL
 */

'use strict';

var crypto = require('crypto');
var AWS = require('aws-sdk');
var firebase = require('firebase');

var elasticTranscoder = new AWS.ElasticTranscoder({
    region: process.env.ELASTIC_TRANSCODER_REGION
});

firebase.initializeApp({
  serviceAccount: process.env.SERVICE_ACCOUNT,
  databaseURL: process.env.DATABASE_URL
});

function encrypt(text){
  var cipher = crypto.createCipher('aes-256-cbc','d6F3Efeq');
  var crypted = cipher.update(text,'utf8','hex');
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text){
  var decipher = crypto.createDecipher('aes-256-cbc','d6F3Efeq');
  var dec = decipher.update(text,'hex','utf8');
  dec += decipher.final('utf8');
  return dec;
}

function pushVideoEntryToFirebase(callback, key) {
    console.log("Adding video entry to firebase at key:", key);

    var database = firebase.database().ref();

    // create a unique entry for this video in firebase
    database.child('videos').child(encrypt(key))
        .set({
            transcoding: true
        })
        .then(function () {
            callback(null, "Video saved");
        })
        .catch(function (err) {
            callback(err);
        });
}

exports.handler = function (event, context, callback) {
    context.callbackWaitsForEmptyEventLoop = false;

    var key = event.Records[0].s3.object.key;
    console.log("Object key:", key);

    //the input file may have spaces so replace them with '+'
    var sourceKey = decodeURIComponent(key.replace(/\+/g, ' '));
    console.log("Source key:", sourceKey);

    //remove the extension
    var outputKey = sourceKey.split('.')[0];
    console.log("Output key:", sourceKey);

    // get the unique video key (the folder name)
    var uniqueVideoKey = encrypt(outputKey.split('/')[0]);

    var params = {
        PipelineId: process.env.ELASTIC_TRANSCODER_PIPELINE_ID,
        OutputKeyPrefix: outputKey + '/',
        Input: {
            Key: sourceKey
        },
        Outputs: [
            {
                Key: outputKey + '-web-480p' + '.mp4',
                PresetId: '1351620000001-000020' //480p 16:9 format
            }
        ]
    };

    elasticTranscoder.createJob(params, function (error, data) {
        if (error) {
            console.log("Error creating elastic transcoder job.");
            callback(error);
            return;
        }

        // the transcoding job started, so let's make a record in firebase
        // that the UI can show right away
        console.log("Elastic transcoder job created successfully");
        pushVideoEntryToFirebase(callback, uniqueVideoKey);
    });
};
}

exports.handler = function (event, context, callback) {
    context.callbackWaitsForEmptyEventLoop = false;

    var key = event.Records[0].s3.object.key;
    console.log("Object key:", key);

    //the input file may have spaces so replace them with '+'
    var sourceKey = decodeURIComponent(key.replace(/\+/g, ' '));
    console.log("Source key:", sourceKey);

    //remove the extension
    var outputKey = sourceKey.split('.')[0];
    console.log("Output key:", sourceKey);

    // get the unique video key (the folder name)
    var uniqueVideoKey = outputKey.split('/')[0];

    var params = {
        PipelineId: process.env.ELASTIC_TRANSCODER_PIPELINE_ID,
        OutputKeyPrefix: outputKey + '/',
        Input: {
            Key: sourceKey
        },
        Outputs: [
            {
                Key: outputKey + '-web-480p' + '.mp4',
                PresetId: '1351620000001-000020' //480p 16:9 format
            }
        ]
    };

    elasticTranscoder.createJob(params, function (error, data) {
        if (error) {
            console.log("Error creating elastic transcoder job.");
            callback(error);
            return;
        }

        // the transcoding job started, so let's make a record in firebase
        // that the UI can show right away
        console.log("Elastic transcoder job created successfully");
        pushVideoEntryToFirebase(callback, uniqueVideoKey);
    });
};
