# repo-walker

Utility that traverses an org in github and does stuff with each repository. 

## usage

`node app.js <github-auth-token> <org-name>`

## output
 
### Markdown of dependency tree

A markdown file called `packages.md` will be generated. Do with it what you will.
It will look like [this](https://github.com/pelias/pelias/blob/master/package_outline.md).

### Pull Requests to merge `master` into `production`

For each repo the following process is applied:

```
check if repo has `production` branch
    if `production` branch exists
        attempt to create a pull request to merge `master` branch into `production` branch
```

___Notes:___
* PR will only be created if differences between `master` and `production` are detected
* If there is already a PR from the current user to do the same thing, a new PR will NOT be created. This is important to note, in case you are running the script multiple times.



