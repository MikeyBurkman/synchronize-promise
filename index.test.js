'use strict';

const Bluebird = require('bluebird');
const singleThread = require('./index');

it('Should only allow one call at a time to a given function', () => {

    var alreadyRunning = false;
    var processingOrder = [];

    // f is our function that we expect to only be executed one at a time.
    var f = singleThread((x) => {
      if (alreadyRunning) {
        return Bluebird.reject(new Error('The service was already running while processing value ' + x));
      }
      alreadyRunning = true;
      processingOrder.push(x);
      return Bluebird.delay(25)
        .then(function () {
          alreadyRunning = false;
          return x;
        });
    });

    return Bluebird.all([
      f(1),
      f(2),
      f(3)
    ]).then(function (results) {
      expect(results).toEqual([1, 2, 3]); // Make sure each function returns the right value
      expect(processingOrder).toEqual([1, 2, 3]); // Make sure they're executed in the right order
    });
  });

  it('Should handle one of the calls failing', () => {
    var f = singleThread((x) => {
      return Bluebird.delay(25).then(() => {
        if (x > 1) {
          throw new Error('x was greater than 1');
        } else {
          return x;
        }
      });
    });

    var p1 = f(1); // This should succeed
    var p2 = f(2) // This we expect to fail
      .reflect()
      .then((res) => {
        var err = res.reason();
        expect(err.message).toEqual('x was greater than 1');
      });

    return Bluebird.all([p1, p2]);
  });
