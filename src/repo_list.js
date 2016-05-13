var async = require('async');
var Github = require('github-api');
var utils = require('./utils');

function repoList(token, org, callback) {

  var context = {
    git: new Github({
      token: token,
      auth: "oauth"
    }),
    token: token,
    org: org,
    output: []
  };

  async.waterfall(
    [
      utils.getOrgInfo.bind(context),
      utils.getRepos.bind(context),
      function (callback) {
        context.repos.forEach(function (repo) {
          console.log(repo.full_name);
        });
        callback();
      }
    ],
    function (err) {
      callback(err, context.output);
    }
  );
}

module.exports = repoList;
