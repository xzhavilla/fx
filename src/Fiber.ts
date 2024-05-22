import { AnyEffector, Effector, Throw, Use } from './Effector'
import * as $Generator from './Generator'
import { ReturnOf, YieldOf } from './Generator'
import * as $Type from './Type'
import { OrLazy } from './Type'
import * as $Fork from './effect/Fork'
import * as $Join from './effect/Join'

export function* all<G extends AnyEffector<any, any, any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
): Effector<
  ReturnOf<G>[],
  YieldOf<G> extends infer Y ? (Y extends Throw<infer E> ? E : never) : never,
  YieldOf<G> extends infer Y ? (Y extends Use<infer R> ? R : never) : never
> {
  const fibers = yield* $Generator.traverse(effectors, $Fork.fork)
  const values = []
  let done = 0
  for (let i = 0; done < fibers.length; i++) {
    const _i = i % fibers.length
    const fiber = fibers[_i]
    if (fiber === undefined) {
      continue
    }

    switch (fiber.status[$Type.tag]) {
      case 'Interrupted':
      case 'Failed':
        return yield* $Join.join(fiber)
      case 'Terminated':
        delete fibers[_i]
        values[_i] = fiber.status.value
        done++

        break
      default:
        yield undefined as never

        break
    }
  }

  return values
}

export function* any<G extends AnyEffector<any, any, any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
): Effector<
  ReturnOf<G>,
  never,
  YieldOf<G> extends infer Y ? (Y extends Use<infer R> ? R : never) : never
> {
  const fibers = yield* $Generator.traverse(effectors, $Fork.fork)
  const errors = []
  let done = 0
  for (let i = 0; done < fibers.length; i++) {
    const _i = i % fibers.length
    const fiber = fibers[_i]
    if (fiber === undefined) {
      continue
    }

    switch (fiber.status[$Type.tag]) {
      case 'Interrupted':
        return yield* $Join.join(fiber) as any
      case 'Failed':
        delete fibers[_i]
        errors[_i] = fiber.status.error
        done++

        break
      case 'Terminated':
        return fiber.status.value
      default:
        yield undefined as never

        break
    }
  }

  throw new AggregateError(errors, 'All fibers failed')
}

export function* race<G extends AnyEffector<any, any, any>>(
  effectors: ReadonlyArray<OrLazy<G>>,
): Effector<
  ReturnOf<G>,
  YieldOf<G> extends infer Y ? (Y extends Throw<infer E> ? E : never) : never,
  YieldOf<G> extends infer Y ? (Y extends Use<infer R> ? R : never) : never
> {
  const fibers = yield* $Generator.traverse(effectors, $Fork.fork)
  for (let i = 0; true; i++) {
    const fiber = fibers[i % fibers.length]
    switch (fiber.status[$Type.tag]) {
      case 'Interrupted':
      case 'Failed':
        return yield* $Join.join(fiber)
      case 'Terminated':
        return fiber.status.value
      default:
        yield undefined as never

        break
    }
  }
}
