#!/usr/bin/env bash

# Runs a command on each commit since master

set -e

cd $(dirname "$0")/..

if [ "$CIRCLE_BRANCH" = "master" ]; then
  yarn install --frozen-lockfile
  eval "$1"
else
  git fetch -u origin master
  
  GIT_SEQUENCE_EDITOR=true GIT_COMMITTER_NAME='Circle CI' GIT_COMMITTER_EMAIL='dev@spendesk.com' \
    git rebase origin/master \
    --interactive \
    --autosquash \
    --exec "yarn install --frozen-lockfile && eval '$1'"
fi
