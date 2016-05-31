
var EventEmitter = require('events').EventEmitter,
    Github = require('github-api'),
    util = require('util');

function Context( token ){
  EventEmitter.call(this);

  this.github = new Github({
    token: token,
    auth: "oauth"
  });
}

util.inherits(Context, EventEmitter);

Context.prototype.loadOrgInfo = function(org, cb) {
  this.github.getUser().show(this.org.name, this.emit.bind(this, 'github:show'));
};

Context.prototype.loadRepos = function(org, cb) {
  this.github.getUser().orgRepos(org.name, this.emit.bind(this, 'github:orgRepos'));
};

Context.prototype.getFile = function(org, repo, filePath){
  this.github
      .getRepo(org.name, repo.name)
      .contents('master', filePath, function(err, meta, data){

    // probably err.error === 404
    if( err ){ return this.emit(filePath, org, repo, err); }

    // parse github response
    var body = new Buffer(JSON.parse(data.responseText).content, 'base64').toString();
    this.emit( 'file:'+filePath, org, repo, null, body );
  }.bind(this));
};

Context.prototype.putBlob = function(org, repo, body){
  this.github
      .getRepo(org.name, repo.name)
      .postBlob(body, function(err, res){

        // WTF?
        console.log( org, repo, body, err, res);
  }.bind(this));
};

Context.prototype.listBranches = function(org, repo) {
  this.github
      .getRepo(org.name, repo.name)
      .listBranches(function( err, data ){
        this.emit( 'github:listBrancehs', org, repo, err, data );
      }.bind(this));
};

// create a new branch from base ref eg. 'master' to a new ref eg. 'foo'
// note: omit the prefix 'refs/heads' for both references.
Context.prototype.createBranch = function(org, repo, baseRef, branchRef) {
  var repoObj = this.github.getRepo(org.name, repo.name);

  // get the reference of the base branch
  repoObj.getRef('heads/'+baseRef, function( err, sha1 ){
    if( err || !sha1 ){ return console.error( 'failed to retrieve ref for', baseRef ); }

    // get the reference of the new branch
    repoObj.getRef('heads/'+branchRef, function( err, sha2 ){
      if( err || !sha2 ){

        // branch doesn't exist; create one
        console.warn( 'failed to retrieve ref for', branchRef );
        console.warn( 'creating new ref for', branchRef );

        // create new branch
        repoObj.createRef({ ref: 'refs/heads/'+branchRef, sha: sha1 }, function( err, res ){
          if( err ){ return console.error( 'failed to create branch', branchRef ); }

          console.warn( 'new sha commit for', branchRef, res.object.sha );
          this.emit( 'github:branch_exists', org, repo, branchRef, res.object.sha );
        }.bind(this));
      }

      // the branch already exists
      else {
        this.emit( 'github:branch_exists', org, repo, branchRef, sha2 );
      }
    }.bind(this));

  }.bind(this));
};

module.exports = Context;
