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

var crypto = require('crypto');
var AWS = require('aws-sdk');
var firebase = require('firebase');

function decrypt(text){
  var decipher = crypto.createDecipher('aes-256-cbc','d6F3Efeq')
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

function encrypt(text){
  var cipher = crypto.createCipher('aes-256-cbc','d6F3Efeq')
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}

function generateResponse(status, message){
    return {
      statusCode: status,
      headers: { "Access-Control-Allow-Origin": "*" },
      body : JSON.stringify(message)
    }
}

exports.handler = function(event, context, callback){
    context.callbackWaitsForEmptyEventLoop = false;
    //eval if user is authenticated should be in API gateway
    
    console.log(JSON.stringify(event));
    var encryptedkey = event.queryStringParameters.encryptedkey;

    var decryptedkey = decrypt(encryptedkey);

    var body = {
	   decrypted: decryptedkey 
    };        
    var response = generateResponse(200, body); 
    callback(null, response);
};
