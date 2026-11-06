import { createBrowserRouter, Outlet } from "react-router";
import AuthLayout from "../Layouts/AuthLayout";
import RequireAuth from "./RequireAuth";
import RequireRequestManager from "./RequireRequestManager";
import RequireVolunteer from "./RequireVolunteer";
import RequireAdmin from "./RequireAdmin";
import RequireRequestEditor from "./RequireRequestEditor";

const routeFallback = (
  <div className="flex min-h-64 items-center justify-center px-4 text-sm font-medium text-slate-600" role="status">
    Loading LifeDrop…
  </div>
);

const router = createBrowserRouter([
  {
    path: "/",
    hydrateFallbackElement: routeFallback,
    lazy: async () => {
      const { default: RootLayout } = await import("../Layouts/RootLayout");
      return { Component: RootLayout };
    },
    children: [
      {
        index: true,
        hydrateFallbackElement: routeFallback,
        lazy: async () => {
          const { default: Home } = await import("../Pages/Home/Home");
          return { Component: Home };
        },
      },
      {
        path: "blog",
        hydrateFallbackElement: routeFallback,
        lazy: async () => {
          const { default: BlogPosts } = await import("../Pages/BlogPosts");
          return { Component: BlogPosts };
        },
      },
      {
        path: "blog/:slug",
        hydrateFallbackElement: routeFallback,
        lazy: async () => {
          const { default: BlogArticle } = await import("../Pages/BlogArticle");
          return { Component: BlogArticle };
        },
      },
      {
        path: "donation-requests",
        hydrateFallbackElement: routeFallback,
        lazy: async () => {
          const { default: DonationRequests } = await import("../Pages/DonationRequests");
          return { Component: DonationRequests };
        },
      },
      {
        path: "search",
        hydrateFallbackElement: routeFallback,
        lazy: async () => {
          const { default: SearchDonors } = await import("../Pages/SearchDonors");
          return { Component: SearchDonors };
        },
      },
      {
        path: "funding",
        element: (
          <RequireAuth>
            <Outlet />
          </RequireAuth>
        ),
        children: [
          {
            index: true,
            hydrateFallbackElement: routeFallback,
            lazy: async () => {
              const { default: Funding } = await import("../Pages/Funding");
              return { Component: Funding };
            },
          },
        ],
      },
      {
        path: "contact",
        hydrateFallbackElement: routeFallback,
        lazy: async () => {
          const { default: ContactUs } = await import("../Pages/ContactUs");
          return { Component: () => <ContactUs standalone /> };
        },
      },
      {
        path: "donation-requests/:requestId",
        element: (
          <RequireAuth>
            <Outlet />
          </RequireAuth>
        ),
        children: [
          {
            index: true,
            hydrateFallbackElement: routeFallback,
            lazy: async () => {
              const { default: DonationRequestDetails } = await import("../Pages/DonationRequestDetails");
              return { Component: DonationRequestDetails };
            },
          },
        ],
      },
    ],
  },
  {
    path: "/",
    Component: AuthLayout,
    children: [
      {
        path: "login",
        hydrateFallbackElement: routeFallback,
        lazy: async () => {
          const { default: Login } = await import("../Pages/Home/Auth/Login");
          return { Component: Login };
        },
      },
      {
        path: "register",
        hydrateFallbackElement: routeFallback,
        lazy: async () => {
          const { default: Register } = await import("../Pages/Home/Auth/Register");
          return { Component: Register };
        },
      },
    ],
  },
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <Outlet />
      </RequireAuth>
    ),
    children: [
      {
        lazy: async () => {
          const { default: DashboardLayout } = await import("../Layouts/DashboardLayout");
          return { Component: DashboardLayout };
        },
        hydrateFallbackElement: routeFallback,
        children: [
          {
            index: true,
            hydrateFallbackElement: routeFallback,
            lazy: async () => {
              const { DashboardHomeRoute } = await import("../Layouts/DashboardLayout");
              return { Component: DashboardHomeRoute };
            },
          },
          {
            path: "profile",
            hydrateFallbackElement: routeFallback,
            lazy: async () => {
              const { default: Profile } = await import("../Pages/DashboardProfile");
              return { Component: Profile };
            },
          },
          {
            path: "notifications",
            hydrateFallbackElement: routeFallback,
            lazy: async () => {
              const { default: Notifications } = await import("../Pages/Notifications");
              return { Component: Notifications };
            },
          },
          {
            path: "all-blood-donation-request",
            element: (
              <RequireVolunteer>
                <Outlet />
              </RequireVolunteer>
            ),
            children: [
              {
                index: true,
                hydrateFallbackElement: routeFallback,
                lazy: async () => {
                  const { default: VolunteerDonationRequests } = await import("../Pages/VolunteerDonationRequests");
                  return { Component: VolunteerDonationRequests };
                },
              },
            ],
          },
          {
            path: "manage-donation-requests",
            element: (
              <RequireVolunteer>
                <Outlet />
              </RequireVolunteer>
            ),
            children: [
              {
                index: true,
                hydrateFallbackElement: routeFallback,
                lazy: async () => {
                  const { default: VolunteerDonationRequests } = await import("../Pages/VolunteerDonationRequests");
                  return { Component: VolunteerDonationRequests };
                },
              },
            ],
          },
          {
            path: "all-users",
            element: (
              <RequireAdmin>
                <Outlet />
              </RequireAdmin>
            ),
            children: [
              {
                index: true,
                hydrateFallbackElement: routeFallback,
                lazy: async () => {
                  const { default: AdminUsers } = await import("../Pages/AdminUsers");
                  return { Component: AdminUsers };
                },
              },
            ],
          },
          {
            path: "donor-verifications",
            element: (
              <RequireAdmin>
                <Outlet />
              </RequireAdmin>
            ),
            children: [
              {
                index: true,
                hydrateFallbackElement: routeFallback,
                lazy: async () => {
                  const { default: AdminDonorVerifications } = await import("../Pages/AdminDonorVerifications");
                  return { Component: AdminDonorVerifications };
                },
              },
            ],
          },
          {
            path: "contact-messages",
            element: (
              <RequireAdmin>
                <Outlet />
              </RequireAdmin>
            ),
            children: [
              {
                index: true,
                hydrateFallbackElement: routeFallback,
                lazy: async () => {
                  const { default: ContactMessages } = await import("../Pages/ContactMessages");
                  return { Component: ContactMessages };
                },
              },
            ],
          },
          {
            element: <RequireRequestManager />,
            children: [
              {
                path: "create-donation-request",
                hydrateFallbackElement: routeFallback,
                lazy: async () => {
                  const { default: CreateDonationRequest } = await import("../Pages/CreateDonationRequest");
                  return { Component: CreateDonationRequest };
                },
              },
              {
                path: "my-donation-requests",
                hydrateFallbackElement: routeFallback,
                lazy: async () => {
                  const { default: MyDonationRequests } = await import("../Pages/MyDonationRequests");
                  return { Component: MyDonationRequests };
                },
              },
            ],
          },
          {
            path: "my-donation-requests/:requestId/edit",
            element: <RequireRequestEditor />,
            children: [
              {
                index: true,
                hydrateFallbackElement: routeFallback,
                lazy: async () => {
                  const { default: EditDonationRequest } = await import("../Pages/CreateDonationRequest");
                  return { Component: EditDonationRequest };
                },
              },
            ],
          },
        ],
      },
    ],
  },
]);
export default router;