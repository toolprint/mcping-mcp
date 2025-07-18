import { z } from 'zod';

// Tool input schemas
export const HelloWorldInputSchema = z.object({});

export const EchoInputSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty'),
});

export const HealthInputSchema = z.object({});

export const NotificationInputSchema = z.object({
  // Required fields
  title: z.string().min(1, 'Title cannot be empty').max(100, 'Title must be 100 characters or less'),
  message: z.string().min(1, 'Message cannot be empty').max(500, 'Message must be 500 characters or less'),
  
  // Optional fields
  subtitle: z.string().max(100, 'Subtitle must be 100 characters or less').optional(),
  urgency: z.enum(['low', 'normal', 'critical']).default('normal'),
  sound: z.union([
    z.boolean(),
    z.enum(['Basso', 'Blow', 'Bottle', 'Frog', 'Funk', 'Glass', 'Hero', 'Morse', 'Ping', 'Pop', 'Purr', 'Sosumi', 'Submarine', 'Tink']),
    z.string().regex(/^\/.*$/, 'Custom sound must be an absolute path')
  ]).default(true),
  timeout: z.number().int().min(1).max(60).default(10),
  icon: z.string().regex(/^\/.*$/, 'Icon must be an absolute path').optional(),
  contentImage: z.string().regex(/^\/.*$/, 'Content image must be an absolute path').optional(),
  open: z.string().url('Open must be a valid URL').optional(),
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
  notificationId: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.number(),
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