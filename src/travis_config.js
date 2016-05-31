
/**
  A task to update all git repositories in a specific org, download + parse + update all
  the .travis.yml config files.

  If a config doesn't exist then we should attempt to create one, otherwise we should update
  them all so that there is consistency.

  The script should then create a new branch named 'travis-yaml-update' and open a PR
  against the master branch so that a human can review it.
**/

// to run this file: ./bin/repo-crawler.js travis_config --org pelias --auth YOURAUTHKEYHERE

var util = require('util'),
    async = require('async'),
    diff = require('deep-diff').diff,
    yaml = require('js-yaml'),
    rl = require('readline-sync'),
    Context = require('./Context');

// which versions we target; past, current, next
var NODE_VERSIONS = [ '0.12.x', '4', '6' ];

// don't fail the build for these versions:
var ALLOW_FAILURES = [ '6' ];

function updateTravisConfig(token, org, callback) {

  var ctx = new Context( token );
  org = { name: org };

  // get contents of travis yaml for each repo
  ctx.on('github:orgRepos', function( err, repos ){
    repos.forEach( function( repo ){
      ctx.getFile(org, repo, '.travis.yml');
    }, this);
  });

  // for every travis config fetched, parse the yaml
  ctx.on('file:.travis.yml', function( org, repo, err, body ){

    // parse yaml
    if( body ){
      try { body = yaml.safeLoad( body ); }
      catch( e ){
        return console.error( 'failed to parse yaml', e.message );
      }
    }

    // queue a task to check the contents of the yaml
    ctx.emit('task:check_travis_config', org, repo, body );
  });

  // update travis config
  ctx.on('task:check_travis_config', function( org, repo, config ){

    var q;
    var header = util.format('repo: %s/%s', org.name, repo.name);
    console.error('checking', header);

    // language detection
    if( !repo || !repo.hasOwnProperty('language') ){
      return console.error('[FAILED TO DETECT LANGUAGE] skipping repo');
    }

    // only js is supported (currently)
    if( repo.language.toLowerCase() !== 'javascript' ){
      return console.error('[UNSUPPORTED LANGUAGE] skipping repo', repo.language);
    }

    // please confirm it's a nodejs app
    q = util.format('%s appears to be a nodejs app correct? ', header);
    if( !ask(q) ){ return console.error('[NO] skipping repo'); }

    // config is empty/missing
    if( !config ){
      q = util.format('%s has no travis config, create one? ', header);
      if( !ask(q) ){ return console.error('[NO] skipping repo'); }

      // init config
      config = {};
    }

    // configure travis.yml (merging existing config)
    config.sudo = false;
    config.language = 'node_js';
    config.node_js = NODE_VERSIONS;
    config.matrix = {
      allow_failures: ALLOW_FAILURES.map( function( ver ){
        return { node_js: ver };
      })
    };

    // prompt user to save yaml
    var saveYAML = yaml.safeDump( config );
    console.error( "==== new config ====" );
    console.error( saveYAML );
    console.error( "====================" );
    q = util.format('%s config updated, would you like to commit it? ', header);
    if( !ask(q) ){ return console.error('[NO] skipping repo'); }

    // queue a job to commit the yaml
    ctx.emit('task:save_travis_config', org, repo, saveYAML );
  });

  // save travis config
  ctx.on('task:save_travis_config', function( org, repo, yaml ){

    // after the branch has been created
    ctx.once('github:branch_exists', function( org, repo, ref, sha ){
      console.log( 'branch sha', ref, sha, yaml );
      // ctx.putBlob(org, repo, 'test');
      // WTF is the workflow for commiting a file to a branch!?
    });

    // create branch / check it exists (idempotent)
    ctx.createBranch(org, repo, 'master', 'travis-yaml-update');
  });

  // load all repos
  ctx.loadRepos(org);
}

// match 'yes' from readline (blocking)
function ask(q) {
  return rl.question(q).match(/^y(es)?$/i);
}

module.exports = updateTravisConfig;
