import {Vector2} from './point';


export class Rect {
  constructor(
    public position: Vector2,
    public size: Vector2,
  ) {}

  static fromBounds(
    topLeft: Vector2,
    bottomRight: Vector2,
  ) {
    return new Rect(
      topLeft,
      {x: bottomRight.x - topLeft.x, y: bottomRight.y - topLeft.y},
    );
  }

  project(point: Vector2): Vector2 {
    point.x = (point.x - this.position.x) / this.size.x;
    point.y = (point.y - this.position.y) / this.size.y;
    return point;
  }
}
