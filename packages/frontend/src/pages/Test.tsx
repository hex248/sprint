import Icon, { iconNames, iconStyles } from "@/components/ui/icon";

function Test() {
  return (
    <main className="w-full min-h-[100vh] flex flex-col justify-center items-center text-center p-4">
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr className="border-b">
              {Array.from(
                { length: Math.ceil(iconNames.length / 10) },
                (_, groupNumber) => groupNumber + 1,
              ).flatMap((groupNumber) => [
                <th key={`name-${groupNumber}`} className="text-left p-2 font-medium">
                  Name
                </th>,
                ...iconStyles.map((iconStyle) => (
                  <th key={`${iconStyle}-${groupNumber}`} className="text-center p-2 font-medium capitalize">
                    {iconStyle}
                  </th>
                )),
              ])}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }, (_, rowNumber) => rowNumber + 1).map((rowNumber) => (
              <tr key={`row-${rowNumber}`} className="border-b hover:bg-muted/50">
                {Array.from(
                  { length: Math.ceil(iconNames.length / 10) },
                  (_, groupNumber) => groupNumber + 1,
                ).flatMap((groupNumber) => {
                  const iconIndex = (groupNumber - 1) * 10 + (rowNumber - 1);
                  const name = iconNames[iconIndex];

                  return [
                    <td key={`name-${groupNumber}-${rowNumber}`} className="font-mono text-sm pl-2 pr-12">
                      {name ?? ""}
                    </td>,
                    ...iconStyles.map((iconStyle) => (
                      <td key={`${iconStyle}-${groupNumber}-${rowNumber}`} className="p-2 text-center">
                        {name ? <Icon icon={name} iconStyle={iconStyle} size={24} /> : null}
                      </td>
                    )),
                  ];
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default Test;
