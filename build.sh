#!/bin/sh

# Update everything (just in case)
npm rebuild
npm install --no-optional --unsafe-perm

# Built and test
grunt --production
