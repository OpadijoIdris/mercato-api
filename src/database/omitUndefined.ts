// Zod infers optional fields as `field?: T | undefined`, but with `exactOptionalPropertyTypes` the
// Prisma input types only accept `field?: T`. Prisma ignores undefined at runtime anyway, so
// repositories drop those keys before a write to make the types line up honestly.
export type WithoutUndefined<T> = { [K in keyof T]: Exclude<T[K], undefined> };

export function omitUndefined<T extends object>(values: T): WithoutUndefined<T> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  ) as WithoutUndefined<T>;
}
