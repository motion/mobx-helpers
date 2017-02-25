import { autorun, reaction } from 'mobx'
import { fromStream } from 'mobx-utils'

// mobx-utils
export * from 'mobx-utils'

// subscribe-aware helpers

export function watch(fn): Function {
  const dispose = autorun(fn)
  this.subscriptions.add(dispose)
  return dispose
}

export function react(fn, onReact, immediately = false): Function {
  const dispose = reaction(fn, onReact, immediately)
  this.subscriptions.add(dispose)
  return dispose
}

export function query(parent, property, { initializer, ...descriptor }) {
  return {
    ...descriptor,
    value: function() {
      const value = initializer.call(this)(arguments)
      // add some helpers
      Object.defineProperties(value, {
        'promise': {
          get: () => new Promise((resolve, reject) => {
            value.$.take(1).subscribe(resolve, reject)
          })
        },
        'observable': {
          get: () => fromStream(value.$)
        },
        'stream': {
          get: () => value.$
        }
      })
      return value
    }
  }
}

export function observeStreams(object) {
  for (const key of Object.keys(object)) {
    const val = object[key]
    if (val && val.$) {
      object[key] = fromStream(val.$)
    }
  }
  return object
}
