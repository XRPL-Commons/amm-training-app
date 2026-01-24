export function dropsToXrp(drops: number): number {
    const dropsPerXrp = 1000000; // 1 XRP = 1,000,000 drops
    return drops / dropsPerXrp;
}