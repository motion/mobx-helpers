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

function valueWrap(value) {
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

function wrap(fn) {
  return
}

export function query(parent, property, descriptor) {
  const { initializer } = descriptor
  console.log(descriptor)
  if (initializer) {
    delete descriptor.initializer
    descriptor.value = function() {
      return valueWrap(initializer.call(this)(arguments))
    }
  }
  else if (descriptor.value) {
    const value = descriptor.value
    descriptor.value = function() {
      return valueWrap(value.apply(this, arguments))
    }
  }
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
