
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

module.exports.getOrgInfo = getOrgInfo;
module.exports.getRepos = getRepos;
