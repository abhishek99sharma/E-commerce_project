# E-Commerce Project: Complete Project Guide

This guide explains how this repository works, how to run it, and where to find the main features. It is based on the current code in this repository.

## 1. What is this project?

A full-stack fashion and accessories store. Customers can create accounts, browse categories and featured products, manage a saved cart, apply personal coupons, and pay through Stripe Checkout. Admin users can create and delete products, mark products as featured, and view sales analytics.

The browser application is a React single-page app. An Express API serves its data and handles authentication, catalog operations, carts, coupons, payments, recommendations, and analytics.

## 2. Technology

- **Frontend:** React 19, Vite, React Router, Zustand, Tailwind CSS, Axios, Framer Motion, Recharts, Lucide icons, and React Hot Toast.
- **Backend:** Node.js ES modules, Express 5, Mongoose, Zod validation, bcryptjs, and JWT.
- **Data and services:** MongoDB for records; Redis (configured for Upstash) for refresh tokens and cached data; Stripe for checkout; Cloudinary for product images; Google Gemini for personalized product recommendations.
- **Run/build:** npm and Vite.

## 3. Repository map

| Path | Responsibility |
|---|---|
| `backend/server.js` | Express app, middleware, API mount points, production frontend hosting, database startup |
| `backend/routes/` | HTTP endpoints and middleware composition |
| `backend/controllers/` | Request handling and business logic |
| `backend/models/` | Mongoose schemas for users, products, orders, coupons, activity |
| `backend/validations/` | Zod request schemas |
| `backend/middleware/` | Authentication, admin checks, request validation |
| `backend/lib/` | MongoDB, Redis, Stripe, Cloudinary, Gemini clients |
| `frontend/src/pages/` | Home, category, login, signup, cart, admin, and purchase pages |
| `frontend/src/components/` | Reusable UI, product cards, cart, admin forms, analytics |
| `frontend/src/stores/` | Zustand state and API actions for users, products, and cart |
| `frontend/src/lib/axios.js` | Axios API base URL and cookie credentials |
| `frontend/public/` | Static images and icons |
| `package.json` | Backend start scripts and combined build command |

## 4. Requirements and setup

Install a current Node.js release with npm. Create/configure these external services: MongoDB, Redis compatible with the Upstash Redis URL format, Stripe, Cloudinary, and Gemini (needed for the AI recommendation path).

The backend loads environment variables from the repository-root `.env`. The variable names used by the source are:

| Variable | Purpose |
|---|---|
| `PORT` | API server port (defaults to 5000) |
| `mongodb_url` | MongoDB connection string; this code uses this exact lowercase name |
| `UPSTASH_REDIS_URL` | Redis connection URL |
| `ACCESS_TOKEN_SECRET` | Secret used to sign access JWTs |
| `REFRESH_TOKEN_SECRET` | Secret used to sign refresh JWTs |
| `ACCESS_TOKEN_EXPIRES` | JWT access-token lifetime, in a format accepted by jsonwebtoken |
| `REFRESH_TOKEN_EXPIRES` | JWT refresh-token lifetime |
| `ACCESS_TOKEN_COOKIE_EXPIRES_MS` | Access cookie lifetime in milliseconds |
| `REFRESH_TOKEN_COOKIE_EXPIRES_MS` | Refresh cookie lifetime in milliseconds |
| `REFRESH_TOKEN_EXPIRES_SECONDS` | Redis TTL for a refresh token |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `GEMINI_API_KEY` | Google Gemini API key |
| `STRIPE_SECRET_KEY` | Stripe server-side secret key |
| `CLIENT_URL` | Frontend origin used for Stripe success/cancel redirects |
| `NODE_ENV` | Set to `production` to serve built frontend and use secure cookies |

Keep actual credentials only in the ignored `.env` file; do not commit secrets. For local development the backend CORS origin is hard-coded to `http://localhost:5173`, and the frontend calls `http://localhost:5000/api`. Use those origins unless you update the corresponding source configuration.

### Start in development

From the repository root:

```sh
npm install
npm install --prefix frontend
npm run dev
```

This runs the backend with nodemon. In a second terminal:

```sh
npm run dev --prefix frontend
```

Vite normally serves the frontend at `http://localhost:5173`; the API defaults to `http://localhost:5000`. The root `npm run build` installs dependencies and builds the frontend. In production mode, the Express server serves `frontend/dist` and uses the same origin for `/api`.

Other useful scripts:

- `npm start`: run backend with Node.
- `npm run build --prefix frontend`: build frontend only.
- `npm run lint --prefix frontend`: run ESLint on frontend.
- `npm run preview --prefix frontend`: locally preview a Vite build.

## 5. Main application flows

### Signup and login

The frontend calls the auth endpoints. The backend validates request shapes with Zod, hashes passwords using bcrypt before storage, and issues access and refresh JWTs in HTTP-only cookies. The refresh token is also saved in Redis. Protected API routes read the access cookie; admin routes additionally require `role: "admin"`.

Signup requires a name of at least 2 characters, valid email, and password of at least 6 characters containing uppercase, lowercase, number, and special character. Login uses email and password.

### Product browsing

The home page loads featured products and shows category tiles. Category pages request products for a category. Product data lives in MongoDB; product images are uploaded to Cloudinary when admins create products. Featured products are cached in Redis. Recommendations use recent user activity and the Gemini API, with Redis caching.

### Cart and coupons

Cart item references and quantities are stored on the user record. The frontend Zustand cart store loads cart contents, updates quantities, removes items, and calculates subtotal/discounted total. Coupon records are tied to a user, have a discount percentage and expiry date, and can be deactivated after successful use. The checkout backend can create a 10% gift coupon after an order reaches $200 (20,000 cents).

### Checkout and orders

The frontend asks the backend to create a Stripe Checkout Session, then redirects the customer to Stripe. Stripe success returns to `/purchase-success?session_id=...`; cancellation returns to `/purchase-cancel`. The success page calls the backend to retrieve the Stripe session. For paid sessions the backend deactivates a used coupon, records an order, and adds purchase activity.

### Admin

The route `/secret-dashboard` is only rendered for a logged-in user with the admin role. It has Create Product, Products, and Analytics tabs. The API also enforces admin access on product listing/creation/deletion/feature toggling and analytics, so hiding the UI is not the only authorization layer.

### Recommendations and activity

User activity records store `view`, `cart`, or `purchase` events with user and product references. The recommendation endpoint uses recent activity and available products, excludes items already carted/purchased, and asks Gemini to rank suitable options. If there is no history it returns up to five available products.

## 6. API reference

All endpoints are mounted under `/api`. Routes marked **protected** require the access-token cookie. **Admin** means protected plus an admin role.

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/auth/signup` | Public | Create account and sign in |
| POST | `/auth/login` | Public | Sign in |
| POST | `/auth/logout` | Public | Clear auth cookies and remove stored refresh token |
| POST | `/auth/refresh-token` | Refresh cookie | Issue a new access token |
| GET | `/auth/profile` | Protected | Get current user profile |
| GET | `/products` | Admin | List all products |
| GET | `/products/featured` | Public | List featured products |
| GET | `/products/recommended` | Protected | Get personalized recommendations |
| GET | `/products/category/:category` | Public | List a category |
| POST | `/products` | Admin | Create product; uploads image to Cloudinary |
| PATCH | `/products/:id` | Admin | Toggle featured state |
| DELETE | `/products/:id` | Admin | Delete product and attempt image cleanup |
| POST | `/products/activity` | Protected | Record view/cart/purchase activity |
| GET | `/cart` | Protected | Read current user's cart products |
| POST | `/cart` | Protected | Add a product to cart |
| PUT | `/cart/:id` | Protected | Set item quantity |
| DELETE | `/cart` | Protected | Remove a product |
| GET | `/coupons` | Protected | Get user's active coupon |
| POST | `/coupons/validate` | Protected | Validate a coupon code |
| POST | `/payments/create-checkout-session` | Protected | Create Stripe Checkout Session |
| POST | `/payments/checkout-success` | Protected | Verify paid session and create order |
| GET | `/analytics` | Admin | Counts, revenue, sales, and daily sales |

For exact JSON fields, inspect the corresponding request validation schemas in `backend/validations/` and controller in `backend/controllers/`.

## 7. Data model overview

- **User:** name, normalized unique email, hashed password (excluded from normal queries), role (`customer` or `admin`), embedded cart product IDs and quantities.
- **Product:** name, description, price, image URL, category, featured flag, timestamps.
- **Order:** user, purchased product references with quantity and price, total amount, unique Stripe session ID, timestamps.
- **Coupon:** unique code, discount percentage, expiration, active flag, user ID (one coupon per user).
- **UserActivity:** user, product, activity type, timestamp; indexed by user/product/type/time.

## 8. State and request handling

Zustand stores frontend session user, catalog state, and cart/coupon totals. Axios includes credentials so browser cookies are sent to the API. The backend's validation middleware checks body, params, and query against Zod schemas. Authentication middleware resolves the cookie JWT to a user; admin middleware checks the user's role.

## 9. Troubleshooting

- **MongoDB connection fails:** Check `mongodb_url`, network access/IP allowlist, and database credentials.
- **Redis/auth errors:** Confirm `UPSTASH_REDIS_URL` is valid and reachable; refresh-token storage depends on Redis.
- **Browser requests fail locally:** Run both servers, keep frontend on port 5173 and backend on port 5000, and confirm the backend CORS origin.
- **Login does not persist:** Ensure Axios uses credentials, cookies are enabled, and frontend/API origins match the configured CORS settings.
- **Stripe checkout fails:** Check `STRIPE_SECRET_KEY`, `CLIENT_URL`, and product image URLs. Use Stripe test credentials for testing.
- **Images fail to upload:** Check Cloudinary credentials and that the submitted image URL/data is accepted by the product form.
- **Recommendations fail:** Check Gemini and Redis configuration. Product listing and checkout are separate features from recommendation generation.
- **No featured products appear:** Add products in admin and toggle the featured state. Featured product reads are cached in Redis.
- **Cannot open admin dashboard:** The current user must have `role: "admin"` in MongoDB; signup defaults to customer.
- **Validation rejects signup:** Password must include uppercase, lowercase, digit, and special character; name must be 2+ characters.
- **Production page/API issue:** Build the frontend first, set `NODE_ENV=production`, and ensure Express can find `frontend/dist`. Configure `CLIENT_URL` to the deployed origin.

## 10. Important implementation notes

These are useful facts to know when changing or debugging the current code:

1. The checkout controller builds Stripe line items from product data sent by the client. For a production commerce system, verify prices and quantities against MongoDB on the server before creating a payment session.
2. Checkout success is verified by retrieving the Stripe session, but the current success route is called by the client rather than a Stripe webhook. Protect against repeated success calls: the order schema has a unique Stripe session ID, and duplicate handling should be considered.
3. The current recommendation endpoint is personalized with Gemini; the home page's separate featured product section is not the same as the recommendations endpoint.
4. The payment code uses USD and treats 20,000 cents as the $200 gift-coupon threshold.
5. Ensure MongoDB contains a trusted admin user; public signup always assigns the customer role.
6. The Redis featured-product cache should be invalidated after featured products change. Review cache invalidation when updating the product controller.

## 11. Where to start when changing something

- Add/edit a page or route: `frontend/src/pages/` and `frontend/src/App.jsx`.
- Change navigation, cards, cart, or admin UI: `frontend/src/components/`.
- Change client API calls or global state: `frontend/src/stores/` and `frontend/src/lib/axios.js`.
- Add/change an API endpoint: `backend/routes/`, then its controller and validation schema.
- Change persistence shape: `backend/models/`.
- Change auth or admin access: `backend/middleware/auth.middleware.js` and auth controller/routes.
- Change service config: `backend/lib/` plus root `.env`.

## 12. Quick interview-style questions

**What does the project do?**  
It is a full-stack fashion e-commerce store with customer accounts, catalog browsing, cart, coupon discounts, Stripe payment, admin product management, analytics, and personalized recommendations.

**How does the frontend communicate with the backend?**  
Axios calls the Express REST API under `/api`, with credentials enabled so auth cookies are included.

**How is a user's password stored?**  
The Mongoose user model hashes it with bcrypt before saving. Password fields are hidden in normal user queries.

**How are protected routes secured?**  
JWT access tokens are stored in HTTP-only cookies. Middleware verifies the token and loads the user. Admin APIs also check the role.

**What does Redis do here?**  
It stores refresh tokens and caches featured products and generated recommendations.

**How are payments handled?**  
The backend creates a Stripe Checkout Session. After return, it retrieves the session and creates an order if Stripe reports payment as paid.

**Where are product images stored?**  
Cloudinary stores uploaded product images; the database keeps their URLs.

**How are analytics calculated?**  
MongoDB counts users/products and aggregates order count/revenue, including a daily time series for the last seven days.

**How do I add another API?**  
Create or extend a route in `backend/routes/`, implement controller logic in `backend/controllers/`, add a Zod schema when it accepts input, and mount the router in `backend/server.js` if it is a new route group.

---

This guide describes the checked-in implementation. If source behavior changes, update this file alongside the code.

