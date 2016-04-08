#!/usr/bin/env node

var util = require('util');
var colors = require('colors');
var args = require('minimist')(process.argv.slice(2));
var repo_list = require('../src/repo_list');


var TOKEN = args.auth || 0;
var ORG = args.org || 0;

if (ORG === 0 || TOKEN === 0) {
  console.error('Usage: node repo_list.js --auth <github-auth-token> --org <org-name>');
  process.exit(1);
}

repo_list(TOKEN, ORG, function (err, output) {

  if (err) {
    console.log(err.message.red);
    return;
  }

  if (output.length > 0) {
    output.forEach(function (item) {
      var msg = '';
      switch (item.type) {
        case 'passive-info':
          msg = item.msg.grey;
          break;
        case 'action-info':
          msg = item.msg.green;
          break;
        case 'warning':
          msg = item.msg.yellow;
          break;
      }
      console.log(msg);
    })
  }

});