# repo-walker

Collection of utilities that traverse an org in github and do stuff with each repository. 

## Dependency outline generator

### setup

#### global install
If you choose to go this route, you can start running your repo-crawler commands from anywhere you'd like.
Run them from your home directory, or from the junk drawer. It will just work.

```bash
$ npm install -g repo-crawler
$ repo-crawler
  Usage: repo-crawler dependencies|merge|repo_list [params]
```

#### the other way
You can also choose to install it without the global flag...

```bash
$ npm install repo-crawler
$ ls ./node_modules
  repo-crawler
```

Or just clone this repo and be done with it...

```bash
$ git clone https://github.com/dianashk/repo-crawler.git
$ cd repo-crawler
$ npm install
```

### usage
So to make it do stuff, you'll need the following commands.

#### `dependencies`
 
```bash
$ repo-crawler dependencies --auth <github-auth-token> --org <org-name> --output my_awesome_outline.md
```
This will generate a markdown of the dependency tree of all the repositories in your github organization.
A markdown file, defaults to `packages.md` if --output parameter is not set, will be generated. Do with it what you will.
It will look like [this](https://github.com/pelias/pelias/blob/master/package_outline.md).


#### `merge`

```bash
$ repo-crawler merge --auth <github-auth-token> --org <org-name> --head <head-branch> --base <base-branch>
```
This command will generate automated Pull Requests to merge the `head` branch into `base`.                  
For each repo the following process is applied:
                  
```
check if repo has `base` branch
  if `base` branch exists
      attempt to create a pull request to merge `head` branch into `base` branch
```
                  
* PR will only be created if differences between `master` and `production` are detected
* If there is already a PR from the current user to do the same thing, a new PR will NOT be created
* The process will alert you if an existing PR is found for doing what you're attempting

```bash
[api] Good news: nothing to merge!
[scripts] Created PR: https://github.com/pelias/scripts/pull/13 with 4 commits [30 add / 22 del / 3 files]
[acceptance-tests] Existing PR found: https://github.com/pelias/acceptance-tests/pull/162
```

#### `repo_list`

```bash
$ repo-crawler repo_list --auth <github-auth-token> --org <org-name> 
```
This is a really simple command to just spit out a list of all the repositories under the specified github organization.
Cuz you know, sometime you need simple things like this.