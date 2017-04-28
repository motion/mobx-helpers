import { observable, autorun, reaction } from 'mobx'

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

// @query value wrapper
function valueWrap(valueGet: Function) {
  const obsrv = observable.box(null)
  let value = {}
  let subscriber = null
  const endPrevious = () => subscriber && subscriber.complete()

  const runner = autorun(() => {
    endPrevious()

    value = valueGet() || {}

    if (value.$) {
      // sub to values
      subscriber = value.$.subscribe(value => obsrv.set(value))
    }
  })

  // helpers
  Object.defineProperties(value, {
    $isQuery: {
      get: () => true,
    },
    promise: {
      get: () => value.exec(),
    },
    observable: {
      get: () => obsrv,
    },
    current: {
      get: () => obsrv.get() || null,
    },
    stream: {
      get: () => value.$,
    },
    dispose: {
      get: () => () => {
        endPrevious()
        runner.dispose()
      },
    },
  })

  return value
}

export function query(parent, property, descriptor) {
  const { initializer } = descriptor

  if (initializer) {
    delete descriptor.initializer
    descriptor.value = function(...args) {
      return valueWrap(() => initializer.call(this).apply(this, args))
    }
  } else if (descriptor.value) {
    const value = descriptor.value
    descriptor.value = function(...args) {
      return valueWrap(() => value.apply(this, args))
    }
  }

  return descriptor
}
