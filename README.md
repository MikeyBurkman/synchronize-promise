# single-thread-promise
For "single-thread synchronizing" async promise functions

### But Node is already single-threaded?
This doesn't change any of that. This library is about making sure that critical sections, that involve async
code, are kept "single-threaded". This should be familiar if you've ever used the `synchronized` keyword in Java.

### Example?
Say you have a function called by an event listener:
```js
service.on('message', (message) => {
  updateDatabase(message)
    .then((res) => logAudit(res))
    .catch((err) => logAuditError(err));
});
```

What happens if `updateDatabase` isn't thread-safe? What if, for whatever reason, you need to ensure that 
nothing calls `updateDatabase` until the previous call to `updateDatabase` has finished?

Solution: this library
```js
const synchronize = require('single-thread-promise');
...
const updateDatabaseSynchronized = synchronize(updateDatabase);

service.on('message', (message) => {
  updateDatabaseSynchronized(message)
    .then((res) => logAudit(res))
    .catch((err) => logAuditError(err));
});
```

Now if multiple `message` events come in quick succession, the calls will be queued up and executed 
in order, one at a time. 

The promise returned by the wrapped function will only resolve (or reject)
when the call has finally had its turn to execute.
