import {
  AnyEffector,
  ContextOf,
  Effector,
  ErrorOf,
  OutputOf,
} from '../Effector'
import * as $Exit from '../Exit'
import * as $Type from '../Type'
import { OrLazy } from '../Type'
import * as $Backdoor from '../effect/Backdoor'
import * as $Exception from '../effect/Exception'
import * as $Interruption from '../effect/Interruption'
import * as $AggregateError from '../error/AggregateError'
import { ConcurrencyError } from '../error/ConcurrencyError'
import * as $Error from '../error/Error'
import { InterruptError } from '../error/InterruptError'

export function all<G extends AnyEffector<any, any, any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
): Effector<OutputOf<G>[], ErrorOf<G>, ContextOf<G>> {
  return $Backdoor.exploit<ContextOf<G>>()(async function* (run) {
    try {
      return await Promise.all(
        effectors.map(run).map((promise) =>
          promise.then((exit) => {
            if ($Exit.isFailure(exit)) {
              throw exit
            }

            return exit.value
          }),
        ),
      )
    } catch (exit) {
      if (!$Exit.is(exit) || !$Exit.isFailure(exit)) {
        throw new Error('Cannot find Promise failure', { cause: exit })
      }

      switch (exit.cause[$Type.tag]) {
        case 'Die':
          throw exit.cause.error
        case 'Fail':
          return yield* $Exception.raise(exit.cause.error as ErrorOf<G>)
        case 'Interrupt':
          return yield* $Interruption.interrupt()
      }
    }
  })
}

export function any<G extends AnyEffector<any, any, any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
): Effector<OutputOf<G>, ConcurrencyError, ContextOf<G>> {
  return $Backdoor.exploit<ContextOf<G>>()(async function* (run) {
    try {
      return await Promise.any(
        effectors.map(run).map((promise) =>
          promise.then((exit) => {
            if ($Exit.isFailure(exit)) {
              throw exit
            }

            return exit.value
          }),
        ),
      )
    } catch (error) {
      if (!$Error.is(error)) {
        throw new Error('Cannot find Promise error', { cause: error })
      }

      if (!$AggregateError.is(error)) {
        throw error
      }

      return yield* $Exception.raise(
        new ConcurrencyError(
          error.errors.map((exit) => {
            if (!$Exit.is(exit) || !$Exit.isFailure(exit)) {
              return new Error('Cannot find Promise failure', { cause: exit })
            }

            switch (exit.cause[$Type.tag]) {
              case 'Die':
              case 'Fail':
                return exit.cause.error
              case 'Interrupt':
                return new InterruptError()
            }
          }),
          error.message,
        ),
      )
    }
  })
}

export function race<G extends AnyEffector<any, any, any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
): Effector<OutputOf<G>, ErrorOf<G>, ContextOf<G>> {
  return $Backdoor.exploit<ContextOf<G>>()(async function* (run) {
    try {
      return await Promise.race(
        effectors.map(run).map((promise) =>
          promise.then((exit) => {
            if ($Exit.isFailure(exit)) {
              throw exit
            }

            return exit.value
          }),
        ),
      )
    } catch (exit) {
      if (!$Exit.is(exit) || !$Exit.isFailure(exit)) {
        throw new Error('Cannot find Promise failure', { cause: exit })
      }

      switch (exit.cause[$Type.tag]) {
        case 'Die':
          throw exit.cause.error
        case 'Fail':
          return yield* $Exception.raise(exit.cause.error as ErrorOf<G>)
        case 'Interrupt':
          return yield* $Interruption.interrupt()
      }
    }
  })
}
