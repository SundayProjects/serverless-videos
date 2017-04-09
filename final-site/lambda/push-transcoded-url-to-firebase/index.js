/**
 * Created by Peter Sbarski
 * Updated by Mike Chambers
 * Last Updated: 1/02/2017
 *
 * Required Env Vars:
 * BUCKET_REGION
 * SERVICE_ACCOUNT
 * DATABASE_URL
 * S3 : https://s3.amazonaws.com/YOUR_TRANSCODED_BUCKET_NAME_HERE
 */

'use strict';

var AWS = require('aws-sdk');
var firebase = require('firebase');

// save the URL to firebase
firebase.initializeApp({
  serviceAccount: process.env.SERVICE_ACCOUNT,
  databaseURL: process.env.DATABASE_URL
}

function encrypt(text){
  var cipher = crypto.createCipher('aes-256-cbc','d6F3Efeq')
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt(text){
  var decipher = crypto.createDecipher('aes-256-cbc','d6F3Efeq')
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
});

exports.handler = function(event, context, callback){
    context.callbackWaitsForEmptyEventLoop = false;

    var key = event.Records[0].s3.object.key;
    var bucket = event.Records[0].s3.bucket.name;

    var regionIdentifier = process.env.BUCKET_REGION === 'us-east-1' ? 's3' : 's3-' + process.env.BUCKET_REGION;

    var videoUrl = process.env.S3 + '/' + key;

    // construct S3 URL based on bucket and key
    // the input file may have spaces so replace them with '+'
    var sourceKey = decodeURIComponent(key.replace(/\+/g, ' '));

    // get the unique video key (the folder name)
    var uniqueVideoKey = encrypt(sourceKey.split('/')[0]);

    var database = firebase.database().ref();

    // update the unique entry for this video in firebase
    database.child('videos').child(uniqueVideoKey).set({
        transcoding: false,
        source: videoUrl
    })
    .then(function(){
        callback(null, 'Added URL' + videoUrl);
    })
    .catch(function(err) {
        callback(err);
    });
};
