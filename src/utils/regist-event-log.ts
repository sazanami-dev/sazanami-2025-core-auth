import prisma from "@/prisma";

type EventCategory = "SECURITY" | "PERFORMANCE" | "USABILITY" | "OTHER"
type EventType = "MESSAGE" | "JSON";

export async function registEventLog(
  category: EventCategory = "OTHER",
  type: EventType = "MESSAGE",
  message: string,
  reporter?: string
) {
  try {
    await prisma.eventLog.create({
      data: {
        category,
        eventType: type,
        payload: message,
        reporter: reporter || "UNKNOWN",
      },
    });
  } catch (error) {
    console.error("Failed to register event log:", error);
  }
}
