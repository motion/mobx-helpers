import { autorun, reaction } from 'mobx'
import { fromStream } from 'mobx-utils'

window.fromStream = fromStream

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

function wrap(fn) {
  return function() {
    const value = fn.apply(this, arguments)

    let stream = null
    let observable = null

    function getStream() {
      if (!stream) {
        stream = value.$
        stream.subscribe()
      }
      return stream
    }

    function getObservable() {
      observable = observable || fromStream(getStream())
      return observable
    }

    // helpers
    Object.defineProperties(value || {}, {
      promise: {
        get: () => value.exec(),
      },
      observable: {
        get: () => getObservable(),
      },
      current: {
        get: () => getObservable().current,
      },
      stream: {
        get: () => getStream()
      },
    })

    return value
  }
}

export function query(parent, property, descriptor) {
  console.log(descriptor)
  if (descriptor.initializer) {
    descriptor.initializer = null
    descriptor.value = wrap(descriptor.initializer)
  }
  if (descriptor.value) {
    descriptor.value = wrap(descriptor.value)
  }
  console.log('done for now')
  return descriptor
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
