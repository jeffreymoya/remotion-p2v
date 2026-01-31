export type Milliseconds = number & { readonly __brand: "ms" };
export type Seconds = number & { readonly __brand: "sec" };

export const ms = (value: number): Milliseconds => value as Milliseconds;
export const sec = (value: number): Seconds => value as Seconds;

export const msToSec = (value: Milliseconds): Seconds => sec(value / 1000);
export const secToMs = (value: Seconds): Milliseconds => ms(value * 1000);
