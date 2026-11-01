import { Outlet } from "react-router";
import Logo from "../Components/Logo";
import BloodDonationImg from "../assets/BloodDonation.png"


const AuthLayout = () => {
    return (
        <div className="max-w-7xl mx-auto">
            <Logo></Logo>
            <div className="flex m-10">
                <div className="flex-1">
                    <Outlet></Outlet>

                </div>
                <div className="flex-1">
                    <img className="rounded-4xl" src={BloodDonationImg} alt=""/>
                </div>
            </div>

        </div>
    );
};

export default AuthLayout;