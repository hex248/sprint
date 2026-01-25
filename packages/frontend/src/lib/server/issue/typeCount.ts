import type { TypeCountResponse } from "@sprint/shared";
import { getServerURL } from "@/lib/utils";
import { getErrorMessage } from "..";

export async function typeCount(organisationId: number, type: string): Promise<TypeCountResponse> {
  const url = new URL(`${getServerURL()}/issues/type-count`);
  url.searchParams.set("organisationId", `${organisationId}`);
  url.searchParams.set("type", type);

  const res = await fetch(url.toString(), {
    credentials: "include",
  });

  if (!res.ok) {
    const message = await getErrorMessage(res, `failed to get issue type count (${res.status})`);
    throw new Error(message);
  }

  return res.json();
}
