# LifeDrop

LifeDrop is a blood donation management application that connects donors with people seeking blood and provides tools to manage donation requests.

## Project status

Implemented features include user authentication and profiles, donor availability and self-reported next-available dates, donor request creation and management, request status timelines with email notifications, public pending-request browsing, donation confirmation, public donor search, public contact submissions with an admin inbox, volunteer request management, admin user management, six-month request activity analytics, and BDT funding through SSLCOMMERZ. Production payment and deployment verification are still pending merchant credentials and deployment.

## Live URL

Not deployed yet.

## Frontend setup

1. Install dependencies with `npm install`.
2. Configure `VITE_API_URL` in a local `.env` file to point to the backend API.
3. Configure the Firebase web app values shown in `Frontend/.env.example`; use the same Firebase project ID for `FIREBASE_PROJECT_ID` in the backend.
4. Enable Google in Firebase Authentication's sign-in providers and add the frontend origin to Firebase Authentication's authorized domains.
5. Start the development server with `npm run dev`.

The backend setup and required server environment variables are documented in the repository's backend configuration examples.

Google sign-in verifies Firebase ID tokens on the backend before issuing a LifeDrop JWT. First-time Google users must select their blood group, district, and upazila/thana to create a donor profile. Keep the Firebase project ID aligned between frontend and backend; never put service-account credentials or other server secrets in frontend variables.

## Profile photos

Profile photos are uploaded to ImgBB by the backend. Set `IMGBB_API_KEY` in `Backend/.env` to enable uploads; the example file is `Backend/.env.example`. Restart the backend after configuring it, and never put the ImgBB key in frontend environment variables. Photo upload is optional: if the service is not configured or an upload fails during registration, the user can choose to create the account without a photo and add one later from the profile page.

## Donor search

Use the public `/search` page to search active donors by blood group, district, and upazila. Results are paginated and contain only public donor profile fields; searches require all three filters.

## Volunteer request management

Volunteers can review and filter all donation requests at `/dashboard/manage-donation-requests`, update any request to a valid donation status, and edit or delete only requests they created. Volunteers cannot create requests or manage users. Donor and admin request edits remain limited to pending requests. Donation-request edits and deletes are restricted to the authenticated requester by the API.

## Admin user management

Administrators can review and filter users at `/dashboard/all-users`, block or unblock accounts, and promote donors to volunteers or administrators. An administrator cannot change their own account status or role, and the last active administrator cannot be blocked.

## Admin request management and dashboard

Administrators can view all requests at `/dashboard/all-blood-donation-request`, filter by status, edit pending requests, update in-progress statuses, and delete requests. The admin dashboard displays donor/request totals, verified total funding in BDT, and a status-distribution chart. Volunteers see the verified funding total as well.

## Donor availability, request history, and analytics

Donors can add a Bangladesh mobile number to their profile. Any number they add is shown publicly on donor search results as a tap-to-call link; leaving the field blank keeps it hidden. Donors can also mark themselves available and optionally set a self-reported date when they expect to be available again. Public donor search excludes donors who opted out and includes donors only on or after their selected date. This is not medical eligibility advice; donors should follow guidance from qualified health professionals.

Donation requests record each status change with the actor and timestamp. The request details page shows this timeline. Request creators and participating donors receive a persistent in-app notification, visible from the dashboard bell and `/dashboard/notifications`, when the request status changes. LifeDrop also sends email notifications to request participants. Configure SMTP on the backend using `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `MAIL_FROM` from [Backend/.env.example](../Backend/.env.example). If SMTP is not configured or delivery fails, the request status still updates and the interface reports that the email was not sent; in-app notifications remain available.

The admin dashboard includes a six-month chart comparing requests created with donations marked done.

## Funding

Authenticated users can contribute between BDT 10.00 and BDT 500,000.00 using the hosted SSLCOMMERZ checkout. Funding history and dashboard totals include only transactions verified against SSLCOMMERZ's server-side validation API; card and mobile payment details are never handled by LifeDrop.

To enable checkout, configure `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_IS_LIVE`, and `CLIENT_URL` in the backend environment. `API_PUBLIC_URL` is an optional public backend URL override; on Render, the service's `RENDER_EXTERNAL_URL` is used when it is unset. Register the `/funding/ipn` endpoint as the merchant IPN listener. Use `SSLCOMMERZ_IS_LIVE=false` and sandbox credentials for testing; live mode requires valid merchant credentials and public HTTPS URLs. Funding history and dashboard totals include only completed payments verified with SSLCOMMERZ; pending or failed attempts are stored with their status but are not counted as funding. See [Backend/.env.example](../Backend/.env.example) for the variable names. Do not expose gateway credentials to the frontend.

## Contact

The public contact form is available from the home page and at `/contact`. Submissions are validated and saved for administrator review in the dashboard at `/dashboard/contact-messages`. Set the optional frontend `VITE_CONTACT_PHONE` value to show a public support phone number.

## Main frontend packages

- React and React Router
- React Hook Form
- Tailwind CSS
- SweetAlert2
- GSAP
- Lucide React
