'use strict';

const Bluebird = require('bluebird');
const singleThread = require('./index');

it('Should only allow one call at a time to a given function', () => {

    const startTimes = {};
    const endTimes = {};

    // f is our function that we expect to only be executed one at a time.
    const f = singleThread((x) => {
      startTimes[x] = Date.now();
      return Bluebird.delay(25)
        .then(function () {
          endTimes[x] = Date.now();
          return x;
        });
    });

    const startTime = Date.now();
    return Bluebird.all([
      f('a'),
      f('b'),
      f('c')
    ]).then(function (results) {
      expect(results).toEqual(['a', 'b', 'c']); // Make sure each function returns the right value

      expect(endTimes['a']).toBeGreaterThan(startTimes['a']); // Sanity check
      expect(startTimes['b']).toBeGreaterThanOrEqual(endTimes['a']); // B needs to start after A has ended
      expect(startTimes['c']).toBeGreaterThanOrEqual(endTimes['b']); // C needs to start after B has ended

      // If we actually performed this in sequence, then the total time should be at
      //  least (time for one function) * (time per function) = 25*3
      expect(Date.now() - startTime).toBeGreaterThan(75);
    });
  });

  it('Should handle one of the calls failing', () => {
    const f = singleThread((x) => {
      return Bluebird.delay(25).then(() => {
        if (x > 1) {
          throw new Error('x was greater than 1');
        } else {
          return x;
        }
      });
    });

    const p1 = f(1); // This should succeed
    const p2 = f(2) // This we expect to fail
      .reflect()
      .then((res) => {
        const err = res.reason();
        expect(err.message).toEqual('x was greater than 1');
      });

    return Bluebird.all([p1, p2]);
  });
