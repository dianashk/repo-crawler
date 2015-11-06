# repo-walker

<<<<<<< HEAD
Utility that traverses an org in github and does stuff with each repository. 

## usage
=======
Collection of utilities that traverse an org in github and do stuff with each repository. 

## Dependency outline generator

### usage
>>>>>>> 1436ad374ea87c17e4642a22ff3712cd79e7620e

```bash
$ node dependencies.js <github-auth-token> <org-name>
```

### output

## output
 
### Markdown of dependency tree

A markdown file called `packages.md` will be generated. Do with it what you will.
It will look like [this](https://github.com/pelias/pelias/blob/master/package_outline.md).


## Automated Pull Requests to merge `master` into `production`

For each repo the following process is applied:

```
check if repo has `production` branch
    if `production` branch exists
        attempt to create a pull request to merge `master` branch into `production` branch
```

### usage 

```bash
$ node merge.js <github-auth-token> <org-name>
```

### output

* PR will only be created if differences between `master` and `production` are detected
* If there is already a PR from the current user to do the same thing, a new PR will NOT be created
* The process will alert you if an existing PR is found for doing what you're attempting

```bash
[api] Good news: nothing to merge!
[scripts] Created PR: https://github.com/pelias/scripts/pull/13 with 4 commits [30 add / 22 del / 3 files]
[acceptance-tests] Existing PR found: https://github.com/pelias/acceptance-tests/pull/162
```
