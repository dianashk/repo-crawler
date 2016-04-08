var async = require('async');
var Github = require('github-api');


function doit(token, org, callback) {

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
      getOrgInfo.bind(context),
      getRepos.bind(context),
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

function getOrgInfo(callback) {
  var context = this;

  var user = context.git.getUser();
  user.show(context.org, function (err, info) {
    if (err) {
      return callback(err);
    }

    context.org = info;
    callback();
  });
}

/**
 * @param {function} callback (err, packages)
 */
function getRepos(callback) {
  var context = this;
  var org = context.org.name;
  var user = context.git.getUser();

  user.orgRepos(org, function (err, repos) {
    context.repos = repos;
    callback();
  });
}

module.exports = doit;