import { z } from 'zod';

// Tool input schemas
export const HelloWorldInputSchema = z.object({});

export const EchoInputSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty'),
});

export const HealthInputSchema = z.object({});

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

export type ServerConfig = z.infer<typeof ServerConfigSchema>;
export type ResourceMetadata = z.infer<typeof ResourceMetadataSchema>;