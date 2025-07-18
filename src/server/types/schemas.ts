import { z } from 'zod';

// Tool input schemas
export const HelloWorldInputSchema = z.object({});

export const EchoInputSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty'),
});

export const HealthInputSchema = z.object({});

export const NotificationInputSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  message: z.string().min(1, 'Message cannot be empty'),
  subtitle: z.string().optional(),
  urgency: z.enum(['low', 'normal', 'critical']).default('normal'),
  sound: z.boolean().default(true),
  timeout: z.number().int().min(0).max(60).default(5),
});

// Tool output schemas
export const HelloWorldOutputSchema = z.object({
  message: z.string(),
});

export const EchoOutputSchema = z.object({
  echo: z.string(),
});

export const HealthOutputSchema = z.object({
  status: z.enum(['green', 'yellow', 'red']),
});

export const NotificationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  notificationId: z.string().optional(),
});

// Server configuration schema
export const ServerConfigSchema = z.object({
  transport: z.enum(['stdio', 'http']),
  port: z.number().int().min(1).max(65535).default(3000),
  host: z.string().default('localhost'),
});

// Resource metadata schema
export const ResourceMetadataSchema = z.object({
  uri: z.string(),
  name: z.string(),
  description: z.string(),
  mimeType: z.string().optional(),
});

// Type definitions
export type HelloWorldInput = z.infer<typeof HelloWorldInputSchema>;
export type HelloWorldOutput = z.infer<typeof HelloWorldOutputSchema>;

export type EchoInput = z.infer<typeof EchoInputSchema>;
export type EchoOutput = z.infer<typeof EchoOutputSchema>;

export type HealthInput = z.infer<typeof HealthInputSchema>;
export type HealthOutput = z.infer<typeof HealthOutputSchema>;

export type NotificationInput = z.infer<typeof NotificationInputSchema>;
export type NotificationOutput = z.infer<typeof NotificationOutputSchema>;

export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type ResourceMetadata = z.infer<typeof ResourceMetadataSchema>;