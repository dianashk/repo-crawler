var async = require('async');
var Github = require('github-api');
var request = require('request');
var fs = require('fs');
var util = require('util');
var exec = require('child_process').exec;
var temp = require('temp');

temp.track();
var TEMP_DIR = temp.mkdirSync('repo-crawler-files');

module.exports = function doit(authToken, org, outputFile, callback) {

  var git = new Github({
    token: authToken,
    auth: "oauth"
  });

  var context = {
    git: git,
    outputFile: outputFile
  };

  async.waterfall(
    [
      getOrgInfo.bind(context, org),
      getPackages,
      checkTravis,
      filterDependencies,
      sortDependencies,
      generateDoc
    ],
    function () {
      callback(null, [{
        type: 'action-info',
        msg: 'All done!'
      }]);
    }
  );
};

function getOrgInfo(orgName, callback) {
  var context = this;

  var user = context.git.getUser();
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
function getPackages(context, callback) {
  var org = context.org.name;
  context.packages = {};

  var user = context.git.getUser();
  user.orgRepos(org, function (err, repos) {

    async.forEach(repos, function (repo, callback) {
        getPackage(context.git, org, repo.name, function (err, pkg) {
          if (!err) {
            pkg.org = context.org;
            pkg.repo = repo.name;
            pkg.repo_url = repo.html_url;
            context.packages[pkg.name] = pkg;
          }
          callback();
        });
      },
      function (err) {
        callback(err, context);
      });
  });
}

function checkTravis(context, callback) {
  async.forEach(
    Object.keys(context.packages),
    function (name, callback) {
      var pkg = context.packages[name];
      checkTravisRepo(context.git, pkg.org.name, pkg.repo, function (err, travisFound) {
        context.packages[name].travis = travisFound;
        callback();
      });
    },
    function (err) {
      callback(err, context);
    });
}

function filterDependencies(context, callback) {

  // process all package dependencies here
  Object.keys(context.packages).forEach(function (name) {
    if (!context.packages[name].dependencies) {
      return;
    }
    context.packages[name].dependencies =
      Object.keys(context.packages[name].dependencies).filter(function (dep) {
        if (!context.packages.hasOwnProperty(dep)) {
          return false;
        }
        context.packages[dep].used = context.packages[dep].used ? (context.packages[dep].used + 1) : 1;
        return true;
      });
  });

  callback(null, context);
}

function sortDependencies(context, callback) {
  context.sortedPackages = Object.keys(context.packages).map(function (key) {
    return context.packages[key];
  });

  context.sortedPackages.sort(function (a, b) {
    if (a.dependencies && b.dependencies) {
      if (a.dependencies.length < b.dependencies.length) {
        return 1;
      }
      else if (a.dependencies.length > b.dependencies.length) {
        return -1;
      }
      return 0;
    }
    else if (!a.dependencies) {
      return 1;
    }
    else if( !b.dependencies) {
      return -1;
    }
    return 0;
  });

  callback(null, context);
}

function generateDoc(context, callback) {
  var out = fs.createWriteStream(context.outputFile || './packages.md');

  out.write(util.format('# ![](%s) %s packages\n', context.org.avatar_url, context.org.name));
  out.write('Table of contents:\n\n');
  context.sortedPackages.forEach(function (pkg) {
    // skip packages used as dependencies elsewhere
    if (pkg.used) {
      return;
    }
    out.write(util.format('  [%s](#%s)\n<br/>\n', pkg.name, pkg.name));
  });
  out.write('--------\n\n\n\n');

  async.eachSeries(context.sortedPackages, function (pkg, callback) {
    // skip packages used as dependencies elsewhere
    if (pkg.used) {
      callback();
      return;
    }

    out.write(util.format('### %s\n\n', buildHomeLink(pkg)));
    out.write(util.format('%s\n\n_%s_\n\n', buildTravisLink(pkg), pkg.description || 'no description'));

    buildNPMLink(pkg, function (err, npmLink) {
      out.write(npmLink);

      if (pkg.dependencies && pkg.dependencies.length > 0) {
        generateDependencies(out, ' ', pkg, context.packages);
      }
      else {
        out.write('no dependencies from this org');
      }
      out.write('\n\n<br/>\n-----\n\n\n');
      callback();
    });
  }, function () {
    out.end();
    callback();
  });
}

function generateDependencies(out, prefix, pkg, packages) {
  pkg.dependencies.forEach(function (dep) {
    var depPkg = packages[dep];

    out.write(util.format('%s* %s    %s\n',
      prefix, buildHomeLink(depPkg), buildTravisLink(depPkg)));

    if (depPkg.dependencies && depPkg.dependencies.length > 0) {
      generateDependencies(out, prefix + '  ', depPkg, packages);
    }
  });
}

function buildHomeLink(pkg) {
  if (pkg.repo_url) {
    var res = util.format('[`%s`](%s)', pkg.name, pkg.repo_url);
    //if (pkg.repo_url !== pkg.homepage) {
    //  res += '  :-1:';
    //}
    return res;
  }
  return util.format('`%s`', pkg.name);
}

function buildNPMLink(pkg, callback) {
  exec('npm info ' + pkg.name, function (err) {
    if (err) {
      callback(null, '');
      return;
    }

    callback(null, util.format(
      '[![NPM](https://nodei.co/npm/%s.png?downloads=true&stars=true)](https://nodei.co/npm/%s)\n\n',
      pkg.name, pkg.name));
  });
}

function buildTravisLink(pkg) {
  if (!pkg.travis) {
    return '';
  }

  return util.format(
    '[![Build Status](https://travis-ci.org/%s/%s.svg?branch=master)](https://travis-ci.org/%s/%s)',
    pkg.org.name, pkg.repo, pkg.org.name, pkg.repo);
}

function checkTravisRepo(git, username, reponame, callback) {
  var repo = git.getRepo(username, reponame);
  repo.contents('master', '.travis.yml', function (err, contents) {
    if (!contents) {
      repo.contents('master', '.travis.yaml', function (err, contents) {
        callback(null, (contents ? true : false));
      });
      return;
    }
    callback(null, true);
  });
}

function getPackage(git, username, reponame, callback) {
  var packageFile = TEMP_DIR + '/' + reponame + '_package.json';
  var repo = git.getRepo(username, reponame);

  repo.contents('master', 'package.json', function (err, contents) {

    if (!contents) {
      callback(new Error('no package file'));
      return;
    }

    download(contents.download_url, packageFile, function () {
      var pkg = require(packageFile);
      fs.unlinkSync(packageFile);
      if (pkg) {
        callback(null, pkg);
      }
      else{
        callback(new Error('no package file'));
      }
    });
  });
}

function download(url, dest, cb) {
  var file = fs.createWriteStream(dest);

  request(url).pipe(file);

  file.on('finish', function() {
    file.close(cb);  // close() is async, call cb after close completes.
  });
}