import './main.html';

import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import Waypoints from '../waypoints';
import Tracks from '../tracks';

if (Meteor.isCordova) {
  Meteor.startup(() => {
    const config = {
      distanceFilter: 5, // https://github.com/transistorsoft/cordova-background-geolocation/blob/master/docs/README.md#config-integer-distancefilter
      stopOnTerminate: false, // allows the plugin to run even when the app has been closed or killed! (diededed)
      stopTimeout: 15, // (def: 5) The number of minutes to wait before turning off location-services after the ActivityRecognition System (ARS) detects the device is STILL
      stopDetectionDelay: 5, // (def: 0) Number of minute to delay the stop-detection system from being activated.
    };
    /* global window*/
    const bgGeo = window.BackgroundGeolocation;


    bgGeo.configure(config, () => Session.set('CORDOVA_BACKGROUND_GEOLOCATION_READY', true));

    bgGeo.getState(({ enabled }) => {
      Session.set('CORDOVA_BACKGROUND_GEOLOCATION_RUNNING', enabled);
    });

    bgGeo.on('location', (waypoint, taskId) => {
      const trackId = window.localStorage.getItem('trackId');
      Waypoints.insert({ trackId, ...waypoint });
      bgGeo.finish(taskId);
    });
  });
}

Meteor.startup(() => {
  window.setInterval(() => Session.set('CURRENT_TIMESTAMP', new Date().getTime()), 1000);
});

Template.webserverStillAliveIndicator.helpers({
  timestamp() {
    return Session.get('CURRENT_TIMESTAMP');
  },
});

Template.tracking.helpers({
  running() {
    return Session.get('CORDOVA_BACKGROUND_GEOLOCATION_RUNNING');
  },
  tracks() {
    return Tracks.find({}, { sort: { timestamp: -1 } });
  },
});

Template.trackingTrack.helpers({
  waypoints() {
    return Waypoints.find({ trackId: this._id }, { sort: { timestamp: -1 } });
  },
  isCurrent() {
    return Session.get('CORDOVA_BACKGROUND_GEOLOCATION_RUNNING') && window.localStorage.getItem('trackId') === this._id;
  },
});
Template.tracking.events({
  'click .start': function () {
    if (Meteor.isCordova) {
      /* global window*/
      window.BackgroundGeolocation.start();

      const trackId = Tracks.insert({ timestamp: new Date() });
      window.localStorage.setItem('trackId', trackId);
      Session.set('CORDOVA_BACKGROUND_GEOLOCATION_RUNNING', true);
    }
  },
  'click .stop': function () {
    if (Meteor.isCordova) {
      /* global window*/
      window.BackgroundGeolocation.stop();

      window.localStorage.removeItem('trackId');
      Session.set('CORDOVA_BACKGROUND_GEOLOCATION_RUNNING', false);
    }
  },
});
