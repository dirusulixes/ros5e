# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Refresh of the themed elements
- Improved Symbaroum language options substituion in character sheet
### Changed
- Rewrite of ensnaring automation to work with *symbaroum5ecore* weapon properties.
- Rewrite of the corruption roll automation to work with *symbaroum5ecore*.
## [0.1.0] - 2022-04-29
Final release of the 0.1 branch. This version of the module was created before the release of the official *symbaroum5ecore* module and it is meant to be used without it. It's fully compatible with Foundry v8 and partially compatible with v9.
### Added
- Proper CHANGELOG file.
- Resting rules are implemented with the exception of the ability to spend hit dice to reduce temporary corruption via the resting UI (planned).
- Corruption rules are implemented and corruption calculations as well as rolls are automated (not fully working in v9).
- The ensnaring weapon property is implemented and automated.
- Some of the default options set by the DnD5e system module are changed to better suit the Ruins of Symbaroum ruleset.
  - Spell slots are not paid by default when casting spell (completely hiding spell slots is planned).
  - Variant resting rules from the DMG are hidden since they are not viable in Ruins of Symbaroum.
- The character sheet is modified to include the required corruption trackers (as resources), and the appropriate languages and currencies.
  - Compatibility with the Tidy5e Sheet module is maintained.
- Some basic styling of the interface is also implemented.