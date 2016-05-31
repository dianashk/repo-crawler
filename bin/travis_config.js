#!/usr/bin/env node

var args = require('minimist')(process.argv.slice(2));
var travis_config = require('../src/travis_config');

var TOKEN = args.auth || 0;
var ORG = args.org || 0;

if (ORG === 0 || TOKEN === 0) {
  console.error('Usage: node travis_engines.js --auth <github-auth-token> --org <org-name>');
  process.exit(1);
}

travis_config(TOKEN, ORG, function (err, output) {
  if (err) {
    console.error(err);
    return;
  }
});
