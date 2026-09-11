import { Readable } from 'stream';
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from '@workspace/api-zod';
import { eq } from 'drizzle-orm';
import { db } from '@workspace/db';
import { salonBarbers } from '@workspace/db/schema';
import { Router, type IRouter, type Request, type Response } from 'express';

import { getSessionToken, getSessionUser, requireAdmin, requireAuth } from '../middleware/auth';
import {
  ObjectNotFoundError,
  ObjectStorageService,
} from '../lib/objectStorage';

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 * Requires auth middleware so public callers cannot mint write-capable URLs.
 */
router.post(
  '/storage/uploads/request-url',
  requireAuth,
  requireAdmin,
  async (req: Request, res: Response) => {
    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Missing or invalid required fields' });
      return;
    }

    try {
      const { name, size, contentType } = parsed.data;
      if (size > 5 * 1024 * 1024) {
        res.status(400).json({ error: 'Image must not exceed 5 MB', message: 'Image must not exceed 5 MB' });
        return;
      }
      if (!contentType.toLowerCase().startsWith('image/')) {
        res.status(400).json({ error: 'Only image uploads are supported', message: 'Only image uploads are supported' });
        return;
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath =
        objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL,
          objectPath,
          metadata: { name, size, contentType },
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, 'Error generating upload URL');
      const unavailable = error instanceof Error && (
        error.message.includes('PRIVATE_OBJECT_DIR not set')
        || error.message.includes('make sure you\'re running on Replit')
      );
      const message = unavailable
        ? 'Object storage uploads are unavailable on this deployment; provide an external image URL instead.'
        : 'Failed to generate upload URL';
      res.status(unavailable ? 503 : 500).json({ error: message, message });
    }
  },
);

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get(
  '/storage/public-objects/*filePath',
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.filePath;
      const filePath = Array.isArray(raw) ? raw.join('/') : raw;
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const response = await objectStorageService.downloadObject(file);

      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));

      if (response.body) {
        const nodeStream = Readable.fromWeb(
          response.body as ReadableStream<Uint8Array>,
        );
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      req.log.error({ err: error }, 'Error serving public object');
      res.status(500).json({ error: 'Failed to serve public object' });
    }
  },
);

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get('/storage/objects/*path', async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join('/') : raw;
    const objectPath = `/objects/${wildcardPath}`;

    // Object entities are private by default. This endpoint is only used for
    // barber photos, so do not expose arbitrary objects to unauthenticated
    // callers. Active barber photos are public; inactive photos remain
    // available to admins so historical barber records can still be managed.
    const [barber] = await db.select({ active: salonBarbers.active })
      .from(salonBarbers)
      .where(eq(salonBarbers.photoPath, objectPath))
      .limit(1);
    if (!barber) {
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    if (!barber.active) {
      const user = await getSessionUser(getSessionToken(req));
      if (user?.role !== 'admin') {
        res.status(404).json({ error: 'Object not found' });
        return;
      }
    }

    const objectFile =
      await objectStorageService.getObjectEntityFile(objectPath);

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(
        response.body as ReadableStream<Uint8Array>,
      );
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, 'Object not found');
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    req.log.error({ err: error }, 'Error serving object');
    res.status(500).json({ error: 'Failed to serve object' });
  }
});

export default router;
