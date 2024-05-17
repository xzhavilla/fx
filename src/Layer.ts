import { ContextOf } from './Effector'
import { Function } from './Function'
import { AnyGenerator } from './Generator'
import { Handler } from './Handler'
import { Struct } from './Struct'
import { Tag } from './Tag'
import * as $Type from './Type'
import { Covariant } from './Type'

declare const R: unique symbol
export interface Layer<in out A, out R = never> {
  readonly [$Type.uri]?: unique symbol
  readonly [R]?: Covariant<R>
  readonly tag: Tag<A>
  readonly handler: Handler<A>
}

export function layer<A, H extends Handler<A>>(
  tag: Tag<A>,
  handler: H,
): Layer<
  A,
  H extends Function
    ? ReturnType<H> extends infer G extends AnyGenerator
      ? ContextOf<G>
      : never
    : H extends Struct
    ? {
        [K in keyof H]: H[K] extends Function
          ? ReturnType<H[K]> extends infer G extends AnyGenerator
            ? ContextOf<G>
            : never
          : never
      }[keyof H]
    : never
> {
  return { tag, handler }
}
