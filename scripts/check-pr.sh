#!/usr/bin/env bash

# Runs yarn prepublishOnly on all commits since master

set -e

git fetch -u origin master

GIT_SEQUENCE_EDITOR=true GIT_COMMITTER_NAME='Circle CI' GIT_COMMITTER_EMAIL='dev@spendesk.com' \
  git rebase origin/master
  --interactive \
  --autosquash \
  --exec 'yarn install --frozen-lockfile && yarn prepublishOnly'
