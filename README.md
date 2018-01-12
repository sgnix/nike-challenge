# Trimet Vehicles Near You

This is a serverless single-page application for Web and Mobile. Its purpose is to show all Trimet vehicles within a radius of 3 miles of your location.

## Live Example

You can see a live example here: [https://naturalist.github.io/nike/](https://naturalist.github.io/nike/). The application will scale its size if viewed from a mobile device. 

Please make sure that your browser or phone allows geolocation services, and that you do not have any tracker blockers, such as Ghostery or uBlock. They can sometimes block Google Maps.

## Background

This project was created on a Wednesday evening as part of this [coding challenge](https://github.com/uber/coding-challenge-tools) for Nike.

The challenge objective has been slightly modified to adapt it better to Portland's Trimet API.

## Problem

Create a service that gives real-time location for public transportation in the immediate vicinity of the user. The app should geolocalize the user, and it should display all vehicles on a map, where the user could see them move in (almost) real time.

## Solution

Given that only publicly available API endpoints have been used, such as [Trimet Vehicle Location Service](https://developer.trimet.org/ws_docs/vehicle_locations_ws.shtml) and [Google Maps](https://maps.google.com), it has been deemed that this application does not need a back end. The latter would have been required **if** either of the services used required authentication.

Therefore, a serverless single-page application with responsive design has been created using the following tools:

* The [VanillaJS JavaScript framework](http://vanilla-js.com) - a fast, lightweight, cross-platform framework
for building incredible, powerful JavaScript applications.
* The [MiniCSS CSS framework](https://minicss.org/index) - providing responsive grids and pleasant typefaces. 
* [Trimet Vehicle Location Service](https://developer.trimet.org/ws_docs/vehicle_locations_ws.shtml)
* [Google Maps](https://maps.google.com)

### Why VanillaJS?

VanillaJS was picked for this project for its robustness, speed and browser support. It provides blazing fast code compilation time and rendering. The [author of this application](https://github.com/naturalist) believes that VanillaJS is the mother of all JavaScript web frameworks. One who can wield VanillaJS, can handle any other arbitrary framework.

As the application grows, it may benefit from moving to another framework, such as Knockout.js or Rivets.js, which will handle event and element dependencies better.

## Why MiniCSS?

It is well known that most web application using Bootstrap (and such) only utilize around 20% of its definitions. The result is very often **application obesity** - a bloated big application that wastes resources and takes too long to load.

MiniCSS is miniscule, yet it handles 99% of the UX cases. This application only uses it for its responsive grids. The MiniCSS is loaded from CDN, so fast delivery times are guaranteed.

## Application Design and Architecture

The entire application is contained inside a single JavaScript closure, so it does not pollute the global namespace. It defines a number of private functions and classes. The outside world only has access to the `app` object, which contains functions needed to bootstrap the application and initialize Google Maps - `run` and `initMap` respectively. 
