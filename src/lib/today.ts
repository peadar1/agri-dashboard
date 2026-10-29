import "server-only";
import { connection } from "next/server";
import { todayDateOnly } from "@/lib/domain/dates";

// Reading the clock must happen at request time under Cache Components.
export async function getToday(): Promise<Date> {
  await connection();
  return todayDateOnly();
}
