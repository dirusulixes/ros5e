<img src="https://img.shields.io/endpoint?url=https://foundryshields.com/version?url=https://raw.githubusercontent.com/dirusulixes/ros5e/master/module.json"> <img src="https://img.shields.io/endpoint?url=https%3A%2F%2Ffoundryshields.com%2Fsystem%3FnameType%3Dfoundry%26url%3Dhttps%3A%2F%2Fraw.githubusercontent.com%2Fdirusulixes%2Fros5e%2Fmaster%2Fmodule.json">

![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/dirusulixes/ros5e?include_prereleases) ![GitHub all releases](https://img.shields.io/github/downloads/dirusulixes/ros5e/total)
# Ruins of Symbaroum 5e Automations and Theming

## What does it do?
This module modifies and extends the the official D&D5e system module to implement the rules from [Ruins of Symbaroum](https://www.kickstarter.com/projects/1192053011/ruins-of-symbaroum-for-5e/description) by Free League.

+ Resting rules are implemented with the exception of the ability to spend hit dice to reduce temporary corruption via the resting UI (planned).
+ Corruption rules are implemented and corruption calculations as well as rolls are automated.
+ The ensnaring weapon property is implemented and automated.
+ Some of the default options set by the DnD5e system module are changed to better suit the Ruins of Symbaroum ruleset.
  + Spell slots are not paid by default when casting spell (completely hiding spell slots is planned).
  + Variant resting rules from the DMG are hidden since they are not viable in Ruins of Symbaroum.
+ The character sheet is modified to include the required corruption trackers (as resources), and the appropriate languages and currencies.
  + Compatibility with the Tidy5e Sheet module is maintained.
+ Some basic styling of the interface is also implemented. 
## How does it do it?
This module is composed of two kinds of code:
+ the good kind, that I lifted from much more competently written modules. In particular [Adventures in Middle-earth](https://gitlab.com/dwinther/aime-module) by [Dan Wither](https://gitlab.com/dwinther) and [FVTT Long Rest Hit Dice Healing for D&D 5e](https://github.com/schultzcole/FVTT-Long-Rest-HD-Healing-5e) by [Cole Schultz](https://github.com/schultzcole).
+ my own kind, that I hackishly put together without any real knoweldge of javascript.

I **actively discourage** anyone from installing this module unless ready to deal with all the possible bugs it introduces. PRs, bug reports, and suggestions are however very welcome in case you do.

## Changelog
[See here for a full changelog](./CHANGELOG.md)