import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller('reset-password')
export class RedirectController {
  @Get(':token')
  redirectToApp(@Param('token') token: string, @Res() res: Response) {

    // Deep link that Android app can open
    const deepLink = `edukid://reset-password/${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Opening EduKid...</title>
          <meta http-equiv="refresh" content="0; url='${deepLink}'" />
          <style>
            body {
              font-family: sans-serif;
              padding: 40px;
              text-align: center;
            }
            a {
              padding: 12px 20px;
              background: #4CAF50;
              color: white;
              border-radius: 6px;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <h2>Opening EduKid...</h2>
          <p>If your app does not open automatically, click below:</p>
          <a href="${deepLink}">Open EduKid App</a>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }
}
