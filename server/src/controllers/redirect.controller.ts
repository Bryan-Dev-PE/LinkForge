import type { Request, Response } from 'express';
import { resolveForRedirect } from '../services/link.service';
import { extractClickContext, recordClick } from '../services/analytics.service';
import { asyncHandler } from '../utils/asyncHandler';

function renderHtmlPage(title: string, message: string, status: number, res: Response): void {
  res.status(status).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} - LinkForge</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc; color: #0f172a; min-height: 100vh; display: grid; place-items: center; }
    .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 48px 40px;
      max-width: 420px; width: calc(100% - 32px); text-align: center; box-shadow: 0 10px 30px rgba(2,6,23,0.06); }
    .badge { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px;
      border-radius: 16px; background: #eff6ff; color: #2563eb; font-size: 28px; font-weight: 800; margin-bottom: 20px; }
    h1 { font-size: 22px; margin-bottom: 10px; }
    p { color: #64748b; font-size: 15px; line-height: 1.6; }
    a.link { display: inline-block; margin-top: 24px; color: #2563eb; font-weight: 600; text-decoration: none; }
    a.link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${status}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a class="link" href="/">Create a short link</a>
  </div>
</body>
</html>`);
}

export const redirectHandler = asyncHandler(async (req: Request, res: Response) => {
  const code = req.params.code;
  const result = await resolveForRedirect(code);

  switch (result.outcome) {
    case 'not_found': {
      renderHtmlPage(
        'Link not found',
        'We could not find this short link. It may have been deleted or the address may be wrong.',
        404,
        res,
      );
      return;
    }
    case 'expired': {
      renderHtmlPage(
        'This link has expired',
        'The short link is no longer available. Please contact the person who shared it.',
        410,
        res,
      );
      return;
    }
    case 'disabled': {
      renderHtmlPage(
        'This link has been disabled',
        'The owner of this link has temporarily disabled it.',
        423,
        res,
      );
      return;
    }
    case 'active': {
      await recordClick({ ...extractClickContext(req), linkId: result.link.id });
      res.redirect(302, result.link.originalUrl);
      return;
    }
  }
});