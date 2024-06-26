import { AnyEffector, ContextOf, ErrorOf, OutputOf } from '../Effector'
import * as $Function from '../Function'
import { OrLazy } from '../Type'
import * as $Fiber from '../fiber/Fiber'
import { Fiber } from '../fiber/Fiber'
import * as $Effect from './Effect'
import { Effect, _Effect, _effect } from './Effect'

export interface Fork<out A, out R> extends _Effect<'Fork'> {
  readonly effector: <_R extends R>() => A extends Fiber<any, any, _R>
    ? AnyEffector<$Fiber.AOf<A>, $Fiber.EOf<A>, $Fiber.ROf<A>>
    : never
  readonly global: boolean
}

function _fork<G extends AnyEffector<any, any, any>>(
  effector: () => G,
  global: boolean,
): Effect<Fiber<OutputOf<G>, ErrorOf<G>, ContextOf<G>>, never, ContextOf<G>> {
  return { ..._effect('Fork'), effector, global }
}

export function fork<G extends AnyEffector<any, any, any>>(
  effector: OrLazy<G>,
) {
  return $Effect.perform(
    _fork($Function.is(effector) ? effector : () => effector, false),
  )
}

export function daemonize<G extends AnyEffector<any, any, any>>(
  effector: OrLazy<G>,
) {
  return $Effect.perform(
    _fork($Function.is(effector) ? effector : () => effector, true),
  )
}
