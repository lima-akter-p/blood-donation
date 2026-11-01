import { createBrowserRouter } from "react-router";
import RootLayout from "../Layouts/RootLayout";
import Home from "../Pages/Home/Home";
import AuthLayout from "../Layouts/AuthLayout";
import Login from "../Pages/Home/Auth/Login";
import Register from "../Pages/Home/Auth/Register";



const router = createBrowserRouter([
  {
    path: "/",
    Component:RootLayout,
    children:[
        {
        index:true,
        Component:Home
        }
    ]
  
   
  },
  {
    path: "/",
    Component: AuthLayout,
    children: [
      {
        path: "login",
        Component: Login,
      },
      {
        path: "register",
        Component: Register,
      },
    ],
  },
]);
export default router;