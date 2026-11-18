# lobby-invitation

An open-source invitation card generator for events. Fill in the details,
get a shareable link, and paste it into WhatsApp, Discord or Slack. The
link shows a preview card, and guests open an interactive invitation.




## How it works

There is no database. The whole invitation (title, host, guest, date,
location, note, template, accent colour) is encoded into the URL itself
as UTF-8 safe base64url, so a link is all you need to share an invite.

Links are untrusted input: every decoded payload is validated and
sanitized before it is rendered.


## Status

- [x] Data model and stateless URL codec (emoji safe, validated)
- [ ] Dynamic Open Graph preview card
- [ ] Creator studio with live preview
- [ ] Guest page with templates (envelope, terminal, holo pass) and RSVP



## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
