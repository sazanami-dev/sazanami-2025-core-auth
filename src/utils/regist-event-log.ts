import prisma from "@/prisma";

type EventCategory = "SECURITY" | "PERFORMANCE" | "USABILITY" | "OTHER"
type EventType = "MESSAGE" | "JSON";

export async function registEventLog(
  category: EventCategory = "OTHER",
  type: EventType = "MESSAGE",
  payload: string,
  reporter?: string
) {
  try {
    await prisma.eventLog.create({
      data: {
        category,
        eventType: type,
        payload: payload,
        reporter: reporter || "UNKNOWN",
      },
    });
  } catch (error) {
    console.error("Failed to register event log:", error);
  }
}
