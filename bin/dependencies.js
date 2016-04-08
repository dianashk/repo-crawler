#!/usr/bin/env node

var util = require('util');
var colors = require('colors');
var args = require('minimist')(process.argv.slice(2));
var dependencies = require('../src/dependencies');

// just in case we'd want to know later
var forkedProcess = (process.argv[2] === 'dependencies');

var TOKEN = args.auth || 0;
var ORG = args.org || 0;
var OUTPUT = args.output || 0;

if (ORG === 0 || TOKEN === 0) {
  console.error('Usage: node dependencies.js --auth <github-auth-token> --org <org-name> [--output <output-file-path>]');
  process.exit(1);
}

dependencies(TOKEN, ORG, OUTPUT, function (err, output) {

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