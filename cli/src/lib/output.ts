const pad = (value: string, width: number) => {
    if (value.length > width) return `${value.slice(0, width - 1)}...`;
    return value.padEnd(width, " ");
};

export const printKeyValue = (entries: Array<[string, string | number | null | undefined]>) => {
    for (const [key, value] of entries) {
        console.log(`${pad(`${key}:`, 14)} ${value ?? "-"}`);
    }
};

export const printTable = (headers: string[], rows: string[][]) => {
    const widths = headers.map((header, idx) => {
        let max = header.length;
        for (const row of rows) {
            max = Math.max(max, row[idx]?.length ?? 0);
        }
        return Math.min(max, 60);
    });

    const headerLine = headers.map((header, idx) => pad(header, widths[idx] ?? header.length)).join("  ");
    const dividerLine = widths.map((width) => "-".repeat(width)).join("  ");
    console.log(headerLine);
    console.log(dividerLine);

    for (const row of rows) {
        console.log(row.map((cell, idx) => pad(cell, widths[idx] ?? cell.length)).join("  "));
    }
};
