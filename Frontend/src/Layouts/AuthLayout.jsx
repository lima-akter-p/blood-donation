import { Outlet } from "react-router";
import Logo from "../Components/Logo";
import BloodDonationImg from "../assets/BloodDonation.png"


const AuthLayout = () => {
    return (
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <Logo />
            <div className="my-8 grid items-center gap-8 lg:my-12 lg:grid-cols-2 lg:gap-14">
                <div className="min-w-0">
                    <Outlet />
                </div>
                <div className="hidden lg:block">
                    <img
                        className="max-h-[720px] min-h-[520px] w-full rounded-4xl object-cover"
                        src={BloodDonationImg}
                        alt="A blood donation bag representing the LifeDrop donor community"
                    />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;