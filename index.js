'use strict';

const Bluebird = require('bluebird');

module.exports = function singleThreadPromise(fn) {

  let isRunning = false;
  const queue = [];

  return function () {
    const args = arguments;
    return new Bluebird((resolve, reject) => {
      queue.push({
        args: args,
        resolve: resolve,
        reject: reject
      });
      startProcessing();
    });
  };

  function startProcessing() {
    if (isRunning) {
      return;
    }

    isRunning = true;
    processQueue()
      .then(() => {
        isRunning = false
      });
  }

  function processQueue() {
    return new Bluebird((resolve) => {
      const vals = queue.shift();
      if (!vals) {
        return resolve();
      }

      Bluebird.try(() => fn.apply(null, vals.args))
        .reflect()
        .then((results) => {
          if (results.isFulfilled()) {
            vals.resolve(results.value());
          } else {
            vals.reject(results.reason());
          }
        })
        .then(() => resolve(processQueue()));
    });
  }

};
