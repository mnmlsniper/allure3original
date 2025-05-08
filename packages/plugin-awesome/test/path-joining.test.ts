/// <reference types="node" />
/// <reference types="vitest" />

import { vi, describe, expect, it, type MockedFunction } from "vitest";
import type { PluginContext, ReportFiles } from "@allurereport/plugin-api";
import AwesomePlugin from "../src/index.js";
import { fixtures } from "./fixtures.js";
import { join as joinPosix } from "path/posix";

// Path joining mechanism tests

describe("Path joining mechanism", () => {
  it("should use posix path joining for all file paths", async () => {
    const mockReportFiles = {
      addFile: vi.fn(),
    } as ReportFiles;

    const context = {
      reportFiles: mockReportFiles,
    } as PluginContext;

    const plugin = new AwesomePlugin();
    await plugin.start(context);
    await plugin.update(context, fixtures.store);

    // Verify that addFile was called at least once
    expect(mockReportFiles.addFile).toHaveBeenCalled();

    // Check all paths that were added
    const calls = (mockReportFiles.addFile as MockedFunction<any>).mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    calls.forEach(([filePath]: [string | { path: string }]) => {
      const normalizedPath = typeof filePath === 'string' ? filePath : filePath.path;
      
      // Check that the path uses forward slashes
      expect(normalizedPath).not.toContain('\\');
      // Check that the path does not contain duplicate slashes
      expect(normalizedPath).not.toMatch(/\/{2,}/);
      // Check that the path does not contain mixed slashes
      expect(normalizedPath).toMatch(/^[^\\]*$/);
      
      // Check that the path is created using path.posix.join
      const pathParts = normalizedPath.split('/');
      if (pathParts.length > 1) {
        const expectedPath = joinPosix(...pathParts);
        expect(normalizedPath).toBe(expectedPath);
      }
    });
  });

  it("should handle nested paths with posix separators", async () => {
    const { files, context } = createFilesCollectorWithCheck((normalizedPath) => {
      // Check that all path parts use forward slashes
      const pathParts = normalizedPath.split('/');
      expect(pathParts.every(part => !part.includes('\\'))).toBe(true);
      // Check that there are no duplicate directories
      const uniqueParts = new Set(pathParts);
      expect(uniqueParts.size).toBe(pathParts.length);
      // Check that the path is created using path.posix.join
      if (pathParts.length > 1) {
        const winPath = joinPosix(...pathParts);
        expect(normalizedPath).toBe(winPath);
      }
    });
    const plugin = new AwesomePlugin();
    await plugin.start(context as PluginContext);
    await plugin.update(context as PluginContext, fixtures.store);
    expect(files.length).toBeGreaterThan(0);
  });

  it("should maintain consistent path structure across platforms", async () => {
    const { files, context } = createFilesCollectorWithCheck((normalizedPath) => {
      // Check that the path uses forward slashes regardless of platform
      expect(normalizedPath).not.toContain('\\');
      // Check that the path does not contain duplicate slashes
      expect(normalizedPath).not.toMatch(/\/{2,}/);
      // Check that the path does not contain mixed slashes
      expect(normalizedPath).toMatch(/^[^\\]*$/);
      // Check that the path is created using path.posix.join
      const pathParts = normalizedPath.split('/');
      if (pathParts.length > 1) {
        const winPath = joinPosix(...pathParts);
        expect(normalizedPath).toBe(winPath);
      }
    });
    const plugin = new AwesomePlugin();
    await plugin.start(context as PluginContext);
    await plugin.update(context as PluginContext, fixtures.store);
    expect(files.length).toBeGreaterThan(0);
  });

  it("should handle singlefile mode correctly on Windows", async () => {
    // Save original platform
    const originalPlatform = process.platform;
    
    try {
      // Emulate Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });

      const mockReportFiles = {
        addFile: vi.fn(),
      } as ReportFiles;

      const context = {
        reportFiles: mockReportFiles,
      } as PluginContext;

      const plugin = new AwesomePlugin({ singleFile: true });
      await plugin.start(context);
      await plugin.update(context, fixtures.store);

      // Verify that addFile was called
      expect(mockReportFiles.addFile).toHaveBeenCalled();

      // Check all paths that were added
      const calls = (mockReportFiles.addFile as MockedFunction<any>).mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      let indexHtmlFound = false;
      calls.forEach(([filePath, content]: [string | { path: string }, Buffer]) => {
        const normalizedPath = typeof filePath === 'string' ? filePath : filePath.path;
        
        // Check that path uses forward slashes even in singlefile mode
        expect(normalizedPath).not.toContain('\\');
        // Check that path doesn't contain duplicate slashes
        expect(normalizedPath).not.toMatch(/\/{2,}/);
        
        // Check that path is created using path.posix.join
        const pathParts = normalizedPath.split('/');
        if (pathParts.length > 1) {
          const expectedPath = joinPosix(...pathParts);
          expect(normalizedPath).toBe(expectedPath);
        }

        // Check index.html content
        if (normalizedPath === 'index.html') {
          indexHtmlFound = true;
          expect(content).toBeDefined();
          expect(content.toString()).toContain('<!DOCTYPE html>');
        }
      });

      // Verify that index.html was generated
      expect(indexHtmlFound).toBe(true);
    } finally {
      // Restore original platform
      Object.defineProperty(process, 'platform', {
        value: originalPlatform
      });
    }
  });

  it("should use posix path joining for attachments", async () => {
    const mockReportFiles = {
      addFile: vi.fn(),
    } as ReportFiles;

    const context = {
      reportFiles: mockReportFiles,
    } as PluginContext;

    const plugin = new AwesomePlugin();
    await plugin.start(context);
    await plugin.update(context, fixtures.store);

    // Verify that addFile was called
    expect(mockReportFiles.addFile).toHaveBeenCalled();

    // Check all paths that were added
    const calls = (mockReportFiles.addFile as MockedFunction<any>).mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    // Check that there is at least one attachment file
    const attachmentPaths = calls
      .map(([filePath]: [string | { path: string }]) => typeof filePath === 'string' ? filePath : filePath.path)
      .filter((path: string) => path.includes('attachments'));
    
    expect(attachmentPaths.length).toBeGreaterThan(0);

    // Verify path format for attachments
    attachmentPaths.forEach((path: string) => {
      // Should only have forward slashes
      expect(path).not.toContain('\\');
      // Should match joinPosix
      const pathParts = path.split('/');
      if (pathParts.length > 1) {
        const expectedPath = joinPosix(...pathParts);
        expect(path).toBe(expectedPath);
      }
    });
  });
}); 