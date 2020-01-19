export interface Point {
  x: number;
  y: number;
}

export type Vector2 = Point;

// TODO (kyle): could do more immutable operations if we pool these.

export function point(x: number = 0, y: number = 0) {
  return {
    x, y,
  };
}
export const create = point;

export function copy(source: Point): Point {
  return point(source.x, source.y);
}

export function add<T extends Point>(target: T, source: Point): T {
  target.x += source.x;
  target.y += source.y;
  return target;
}

export function subtract<T extends Point>(target: T, source: Point): T {
  target.x -= source.x;
  target.y -= source.y;
  return target;
}

export function scale<T extends Point>(target: T, scalar: number): T {
  target.x *= scalar;
  target.y *= scalar;
  return target;
}

export function set<T extends Point>(target: T, source: Point): T {
  target.x = source.x;
  target.y = source.y;
  return target;
}

export function normalize(point: Point) {
  const distance = Math.sqrt(point.x * point.x + point.y * point.y); 
  const scale = distance !== 0 ? 1 / distance : 1;

  point.x *= scale;
  point.y *= scale;

  return point;
}

export function floor(point: Point) {
  point.x = Math.floor(point.x);
  point.y = Math.floor(point.y);
  return point;
}

export function assignMin(point: Point) {
  const min = Math.min(point.x, point.y);
  point.x = min;
  point.y = min;
  return point;
}

export function isInBox(point: Point, position: Point, size: Point): boolean {
  return point.x > position.x && point.y > position.y && point.x < position.x + size.x && point.y < position.y + size.y;
}

export function distance(pointA: Point, pointB: Point): number {
  const deltaX = pointA.x - pointB.x;
  const deltaY = pointA.y - pointB.y;
  return Math.sqrt(deltaX*deltaX + deltaY*deltaY);
}

export function cheapDistance(pointA: Point, pointB: Point): number {
  return Math.abs(pointA.x - pointB.x) + Math.abs(pointA.y - pointB.y);
}

export function isZero(point: Point): boolean {
  return point.x === 0 && point.y === 0;
}
