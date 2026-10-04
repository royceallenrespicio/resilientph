import { z } from "zod"

/**
 * Validation schema for the /api/chat endpoint payload
 */
export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1, "Message content cannot be empty"),
      })
    )
    .min(1, "Message history must contain at least one message"),
})

/**
 * Validation schema for the /api/reports endpoint payload
 */
export const reportRequestSchema = z.object({
  category: z.string().min(1, "Category is required"),
  subType: z.string().min(1, "SubType is required"),
  description: z.string().nullable().optional(),
  latitude: z.number({ message: "Latitude is required" }),
  longitude: z.number({ message: "Longitude is required" }),
  imageUrl: z.string().nullable().optional().or(z.literal("")),
  isAnonymous: z.boolean().optional().default(false),
})

/**
 * Validation schema for the /api/moderate endpoint payload
 */
export const moderateRequestSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().nullable().optional().or(z.literal("")),
})
