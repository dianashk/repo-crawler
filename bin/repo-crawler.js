#!/usr/bin/env node

var childProcess = require('child_process');

switch (process.argv[2]) {
  case 'dependencies':
    childProcess.fork('./bin/dependencies.js', process.argv);
    break;
  case 'merge':
    childProcess.fork('./bin/merge.js', process.argv);
    break;
  case 'repo_list':
    childProcess.fork('./bin/repo_list.js', process.argv);
    break;
  case 'travis_config':
    childProcess.fork('./bin/travis_config.js', process.argv);
    break;
  default:
    console.error('Usage: repo-crawler dependencies|merge|repo_list [params]');
}
