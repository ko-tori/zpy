export function countAsMap<T>(arr: T[]) {
    const m = new Map<T, number>();
    arr.forEach(v => {
        m.set(v, 1 + (m.get(v) ?? 0));
    })
    return m;
}