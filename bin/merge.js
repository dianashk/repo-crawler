#!/usr/bin/env node

var util = require('util');
var colors = require('colors');
var args = require('minimist')(process.argv.slice(2));
var merge = require('../src/merge');


var HEAD = args.head || 'master';
var BASE = args.base || 'staging';
var TOKEN = args.auth || 0;
var ORG = args.org || 0;

if (ORG === 0 || TOKEN === 0) {
  console.error('Usage: node merge.js --auth <github-auth-token> --org <org-name> --head <head-branch> --base <base-branch>');
  process.exit(1);
}

console.log(util.format('Let\'s merge %s into %s:', HEAD.red, BASE.red));

merge(HEAD, BASE, TOKEN, ORG, function (err, output) {

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
    });
  }
  else {
    console.log('Nothing happened! :( weird');
  }
});