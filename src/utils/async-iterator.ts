type Atom<T> = (iterator: AsyncIterableIterator<T>) => AsyncIterableIterator<T>;

export function compose<T>(...atoms: Array<Atom<T>>) {
  return iterator => {
    for (const atom of atoms) {
      iterator = atom(iterator);
    }
    return iterator;
  };
}

export async function pipe<T>(
  iterator: AsyncIterableIterator<T>,
  ...atoms: Array<Atom<T>>
): Promise<void> {
  return compose(...atoms)(iterator);
}

export async function flush<T>(
  iterator: AsyncIterableIterator<T>,
  ...atoms: Array<Atom<T>>
): Promise<void> {
  const composition = compose(...atoms);
  for await (const item of composition(iterator)) {
    // pass
  }
}

export async function* fromStream(stream: ReadableStream) {
  const reader = stream.getReader();
  while (true) {
    const {done, value} = await reader.read();
    if (done) {
      return;
    }

    yield value;
  }
}

export async function* reChunk<C>(
  iterable: AsyncIterableIterator<C>,
  handler: (newChunk: C, item: C) => {chunk: C | void; buffer: C},
  initial: C,
) {
  let buffer = initial;
  for await (const item of iterable) {
    let step = handler(buffer, item);

    while (step.chunk) {
      yield step.chunk;
      buffer = step.buffer;
      step = handler(initial, buffer);
    }

    buffer = step.buffer;
  }
}

export async function* take<T>(
  iterable: AsyncIterableIterator<T>,
  limit: number,
): AsyncIterableIterator<T> {
  let count = 0;
  for await (const item of iterable) {
    yield item;
    count++;
    if (count > limit) {
      return;
    }
  }
}

export async function* filter<T>(
  iterable: AsyncIterableIterator<T>,
  test: (item: T) => unknown,
): AsyncIterableIterator<T> {
  for await (const item of iterable) {
    if (test(item)) {
      yield item;
    }
  }
}

export async function* seak<T>(
  iterable: AsyncIterableIterator<T>,
  test: (item: T) => unknown,
): AsyncIterableIterator<T> {
  let found = false;
  for await (const item of iterable) {
    if (found) {
      yield item;
    } else if (test(item)) {
      yield item;
      found = true;
    }
  }
}

export async function* seak2<T>(
  iterable: AsyncIterableIterator<T>,
  test: (item: T) => unknown,
): AsyncIterableIterator<T> {
  let done;
  do {
    const promise = iterable.next()
    const step = await promise;
    done = step.done;
    if (test(step.value)) {
      yield step.value;
      break;
    }
  } while (!done)
  yield *iterable;
}

export async function* map<T, R>(
  iterable: AsyncIterableIterator<T>,
  mapper: (item: T) => R,
): AsyncIterableIterator<R> {
  for await (const item of iterable) {
    yield mapper(item);
  }
}

export async function reduce(iterable, reducer, initial) {
  let acc = initial;
  for await (const item of iterable) {
    acc = reducer(acc, item);
  }
  return acc;
}

export async function* buffer(iterator, size: number) {
  let buffer = [];

  for await (const item of iterator) {
    buffer.push(item);

    if (buffer.length === size) {
      yield buffer;
      buffer = [];
    }
  }

  yield buffer;
}

export async function *animate(iterator) {
  for await (const item of iterator) {
    await awaitAnimationFrame();
    yield item;
  }
}

function awaitAnimationFrame(): Promise<number> {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
}
