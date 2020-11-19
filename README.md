# README #

jsmk is yet-another build system. This one is based on nodejs and can be used
to build / compile complex projects in today's common languages and deployment
modalities.  jsmk supports multi-threaded parallel builds with a simple scheme 
for characterizing parallelism - ie: you can express sequential and parallel
tasks.

### This repo holds the jsmk build system ###

* Requires nodejs and a few npm modules (see package.json).
* This is a work in progress

### How do I get set up? ###

* Clone this repo
* Make sure nodejs is installed and in your path
* We are currently using extra modules - installed under node_modules.
  So issue: `npm install` to get
    * minimist (arg parsing)
    * winston (logging)
* Make sure jsmk can find configuration settings
    * you'll probably want to augment the ones present in _Config.jsmk
