# Free Render deployment

This is a password-protected demo for trusted users. Submitted C runs as the
backend user; the Docker image is not an isolated per-job execution service.
Do not give access to untrusted users or put sensitive credentials in this service.

## Deploy

1. Push the Dockerfile, `.dockerignore`, `render.yaml`, and backend changes to GitHub.
2. Sign in at https://dashboard.render.com using a free workspace.
3. Choose **New > Blueprint**, connect the Lexora repository and deployment branch,
   and select the root `render.yaml`.
4. Set `DEMO_PASSWORD` to a strong, unique demo password in Render. The username
   defaults to `demo`. Do not commit the password to GitHub.
5. Confirm the web service is on **Free**, then deploy. No database or paid disk is needed.
6. Render builds the Docker image and gives the service an HTTPS `onrender.com` URL.
   Open it, enter the demo username/password, and compile the default lexer.
7. Check `/api/health`: `flex`, `bison`, `gcc`, and `timeout` should all be `true`.

Alternatively, choose **New > Web Service**, select the repository, use Docker
with `./Dockerfile`, leave the root directory empty, select **Free**, set
`DEMO_USERNAME=demo` and `DEMO_PASSWORD`, and use `/api/health` as the health check.

Render supplies `RENDER_EXTERNAL_URL`, `PORT`, and HTTPS automatically. The app
serves its frontend and API from the same service; no frontend API URL is needed.
For a custom domain, also set `FRONTEND_ORIGIN` to the exact HTTPS origin.

## Cost and limitations

Use the Free service and free `onrender.com` address. Do not add paid resources.
Without a payment method, excess usage suspends services or disables new builds
instead of billing for additional usage. Verify the current account terms in
Render before proceeding; there is no promise of unlimited hosting or permanent pricing.

Free services sleep after 15 minutes of inactivity and typically take about a
minute to wake. Render includes 750 free service hours per workspace per month,
plus bandwidth/build limits. Local temporary files disappear on restarts; browser
drafts remain on the user's device. No database is required.

Current provider documentation: https://render.com/docs/free

## Local checks

```sh
npm run test:deployment
docker build -t lexora .
```

To run the image locally, set `DEMO_USERNAME`, `DEMO_PASSWORD`, and
`FRONTEND_ORIGIN=http://localhost:10000` in your shell, then:

```sh
docker run --rm -p 127.0.0.1:10000:10000 --env DEMO_USERNAME --env DEMO_PASSWORD --env FRONTEND_ORIGIN lexora
```

Open http://localhost:10000. Hosted access must use HTTPS.
