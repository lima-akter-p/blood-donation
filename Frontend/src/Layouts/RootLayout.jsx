import { Outlet } from "react-router";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import { useAuth } from "../context/useAuth";


const RootLayout = () => {
    const { user, loading, logout } = useAuth();
    return (
        <div>
           <Navbar user={user} loading={loading} logout={logout}></Navbar>
          <Outlet></Outlet> 
          <Footer></Footer> 
        </div>
    );
};

export default RootLayout;