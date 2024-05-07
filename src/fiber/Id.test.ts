import * as $Id from './Id'

describe('Id', () => {
  test('converting to string', () => {
    expect(`${$Id.id($Id.id())}`).toStrictEqual('#0.1')
  })

  test('comparing equal identifiers', () => {
    const id = $Id.id()

    expect(id).toStrictEqual(id)
  })

  test('comparing different identifiers', () => {
    expect($Id.id()).not.toStrictEqual($Id.id())
  })
})