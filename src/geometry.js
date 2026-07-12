export function segmentHitsCircle(start, end, circle) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return distanceSquared(start, circle) <= circle.radius * circle.radius;
  }

  const projection =
    ((circle.x - start.x) * dx + (circle.y - start.y) * dy) / lengthSquared;
  const t = Math.max(0, Math.min(1, projection));
  const closest = { x: start.x + t * dx, y: start.y + t * dy };
  return distanceSquared(closest, circle) <= circle.radius * circle.radius;
}

function distanceSquared(point, circle) {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  return dx * dx + dy * dy;
}
