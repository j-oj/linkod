# UP Mindanao Organization Directory
A comprehensive directory of all student organizations in University of the Philippines Mindanao as a final project for CMSC 127 (File Processing & Database Systems).

## Tech Stack
- Vite React
- Supabase

## Dev Team
- UI/UX: @komimir
- FE: @png16
- BE: @j-oj
- PM: @10lite

## Making Commits
### 1. Cloning branch:
- git clone `link of github-repo`

### 2. Before making changes in dev-branch:
```
- git checkout dev-branch     // go to dev-branch
- git pull origin main        // merges main branch with current branch
- git push                    // push changes to the cloud 
```
Doing these 3 commands ensures you are updated to the latest version of the main branch. You may now make changes to the code.


### 3. After making changes in dev-branch:

__Commit and push changes to dev-branch with commit message in the vscode git GUI__
```
- git pull origin main        // merges main branch with current branch
- git push                    // push changes to the cloud 
- git checkout main           // change branch to main
- git pull                    // get recent changes 
- git merge dev-branch        // merge changes from dev-branch
- git push                    // push changes to the cloud 
- git checkout dev-branch     // return to dev-branch
```