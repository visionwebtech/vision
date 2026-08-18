# Vision Web Tech Production Setup

## 1) Existing Supabase project
This project already uses the provided frontend connection values in `assets/js/supabase-client.js`:
- Project URL: `https://mwznwyktcqrohvsqopmb.supabase.co`
- Publishable key: already configured in the project
- Sole admin email: `VISIONWEBTECH.INFO@GMAIL.COM`

No service-role key is used in the frontend.

## 2) SQL migration
Open Supabase → **SQL Editor**.
Run:
1. `supabase-setup.sql` if you still need the earlier base setup
2. `supabase-upgrade.sql` from this project

The upgrade SQL safely:
- preserves existing orders
- adds/normalizes customer-linked order fields
- adds `user_id`
- adds expected delivery, delivery URL and customer-visible admin note support
- creates pricing, services, portfolio and site settings tables if missing
- enables Row Level Security
- seeds default pricing/services/portfolio/settings

## 3) Admin account
Create or use the admin auth account in Supabase Authentication:
- Email: `VISIONWEBTECH.INFO@GMAIL.COM`
- Password: choose your own secure password

If email confirmation is enabled in your Supabase project, confirm the admin email before logging in.

## 4) Deploy the static website
This is a static project and can be deployed to:
- GitHub Pages
- Netlify
- Cloudflare Pages

Upload the full project folder exactly as included in the ZIP.

## 5) Core pages now included
- `index.html`
- `about.html`
- `services.html`
- `pricing.html`
- `partnership.html`
- `contact.html`
- `auth.html`
- `order.html`
- `customer-dashboard.html`
- `admin-login.html`
- `admin-dashboard.html`
- `supabase-setup.sql`
- `supabase-upgrade.sql`

## 6) Customer signup test
1. Open `auth.html`
2. Click **Sign Up**
3. Enter name, email and password
4. Submit signup
5. If your Supabase project requires email confirmation, confirm the email first
6. Log in using the same customer account
7. Confirm redirect into the customer flow or dashboard

## 7) Customer login test
1. Open `auth.html`
2. Enter customer email and password
3. Confirm successful redirect to `customer-dashboard.html` or the requested next page

## 8) Place a real website order
1. Open `pricing.html`
2. Click **Choose Starter**, **Choose Business**, or **Choose Premium**
3. If not logged in, the site redirects to signup/login first
4. After authentication, `order.html` opens with the selected package preselected
5. Fill:
   - Full Name
   - Email
   - Phone
   - Business Name
   - Service
   - Package
   - Requirements / Project Description
6. Click **Place Order**
7. Confirm success message appears
8. Confirm redirect to `customer-dashboard.html`

## 9) Check the order in Supabase
Open Supabase → **Table Editor** → `public.orders`.
Verify the inserted row contains:
- `user_id`
- `full_name`
- `email`
- `phone`
- `business_name`
- `service`
- `package`
- `requirements`
- `status = Pending Review`
- timestamps

## 10) Customer My Orders test
1. Stay logged in as the same customer
2. Open `customer-dashboard.html`
3. Confirm the real order appears
4. Open the order card details
5. Confirm status, expected delivery, requirements and delivery section are visible

## 11) Admin login test
1. Open `admin-login.html`
2. Sign in using `VISIONWEBTECH.INFO@GMAIL.COM`
3. Confirm redirect to `admin-dashboard.html`
4. Confirm the customer order appears in the orders section

## 12) Admin order update test
Inside `admin-dashboard.html`:
1. Search or open the order
2. Change status to **Accepted**
3. Save
4. Change status to **In Progress**
5. Add expected delivery, for example `Within 48 Hours`
6. Add a customer-visible admin message
7. Add the delivery website URL
8. Change status to **Completed**
9. Save again

## 13) Customer delivery test
1. Return to the customer account
2. Open `customer-dashboard.html`
3. Confirm the latest status is visible
4. Confirm the expected delivery text is visible
5. Confirm the customer-visible message is visible
6. Confirm **Website Delivered** appears when completed
7. Confirm **Open Website** button appears only when delivery URL exists
8. Click it and verify it opens the correct website

## 14) Pricing management test
1. Log in as admin
2. Open `admin-dashboard.html`
3. Change the Starter, Business or Premium package price
4. Save
5. Open the public `pricing.html`
6. Confirm the updated price now appears on the public page

## 15) Security expectations
- Customers can insert only their own orders
- Customers can read only their own orders
- Customers cannot change order status, delivery URL or admin-controlled updates
- Admin can read and update all orders
- Public users can read pricing/services/portfolio/settings where allowed
- Only admin can modify pricing/services/portfolio/site settings

## 16) GitHub Pages deployment note
Because everything is static:
- keep all paths relative
- upload the project as-is
- do not remove JS module files
- do not rename pages without updating links
