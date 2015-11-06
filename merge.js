var async = require('async');
var Github = require('github-api');
var request = require('request');
var fs = require('fs');
var util = require('util');
var exec = require('child_process').exec;
var colors = require('colors');

if (process.argv.length !== 4) {
  console.error('Usage: node merge.js <github-auth-token> <org-name>');
  process.exit(1);
}

var git = new Github({
  token: process.argv[2],
  auth: "oauth"
});

(function doit() {

  var org = process.argv[3];

  async.waterfall(
    [
      getOrgInfo.bind(null, org),
      getRepos,
      mergeToProd
    ],
    function () {
      console.log('All done!');
    }
  );
})();

function getOrgInfo(orgName, callback) {
  var context = {};

  var user = git.getUser();
  user.show(orgName, function (err, info) {
    if (err) {
      return callback(err);
    }

    context.org = info;
    callback(null, context);
  });
}

/**
 * @param context
 * @param {function} callback (err, packages)
 */
function getRepos(context, callback) {
  var org = context.org.name;
  var user = git.getUser();

  user.orgRepos(org, function (err, repos) {
    context.repos = repos;
    callback(null, context);
  });
}

function mergeToProd(context, callback) {
  async.eachSeries(
    context.repos,
    createMergePR,
    callback
  );
}

function createMergePR(_repo, callback) {
  var repo = git.getRepo(_repo.owner.login, _repo.name);
  repo.name = _repo.name;

  async.series(
    [
      checkForProductionBranch.bind(null, repo),
      checkForExistingPRs.bind(null, repo),
      createPR.bind(null, repo)
    ],
    function () {
      callback();
    }
  );
}

function checkForProductionBranch(repo, callback) {
  repo.listBranches(function (err, branches) {
    if (branches.indexOf('production') > -1) {
      callback();
    }
    else {
      callback(new Error('No production branch'));
    }
  });
}

function checkForExistingPRs(repo, callback) {
  // check if a PR like this already exists and provide a link to it
  repo.listPulls('open', function (err, prs) {
    var existing = false;
    prs.forEach(function (pullRequest) {
      if (pullRequest.base.ref === 'production' && pullRequest.head.ref === 'master') {
        existing = true;

        var message= util.format(
          '[%s] Existing PR found: %s',
          repo.name,
          pullRequest.html_url
        );
        console.log(message.yellow);
      }
    });

    if (existing) {
      callback(new Error('PR already exists'));
    }
    else {
      callback();
    }
  });
}

function createPR(repo, callback) {
  var pull = {
    title: 'Merge master into production',
    body: "This pull request has been automatically generated by repo-walker.",
    base: "production",
    head: "master"
  };
  repo.createPullRequest(pull, function (err, pullRequest) {
    if (err || typeof pullRequest === 'undefined') {
      var message = '[' + repo.name + '] Good news: nothing to merge!';
      console.log(message.grey);
      callback();
      return;
    }

    var message = util.format(
      '[%s] Created PR: %s with %d commits [%d add / %d del / %d files]',
      repo.name,
      pullRequest.html_url,
      pullRequest.commits,
      pullRequest.additions,
      pullRequest.deletions,
      pullRequest.changed_files
    );
    console.log(message.green);
    callback();
  });
}
