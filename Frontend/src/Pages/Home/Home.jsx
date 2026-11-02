import AboutLifeDrop from "../../Components/AboutLifeDrop";
import Banner from "../../Components/Banner";
import BlogPosts from "../../Components/BlogPost";
import ContactUs from "../ContactUs";
import BloodDonationAbout from "../../Components/BloodDonationAbout";
import BloodDonationInfo from "../../Components/BloodDonationInfo";
import DonorInfoSection from "../../Components/DonorInfoSecton";




const Home = () => {
    return (
        <div>
          <Banner></Banner> 
          <DonorInfoSection></DonorInfoSection>
          <BloodDonationInfo></BloodDonationInfo>
          <BloodDonationAbout></BloodDonationAbout>
          <AboutLifeDrop></AboutLifeDrop>
          <BlogPosts></BlogPosts>
          <ContactUs></ContactUs>
         
        </div>
    );
};

export default Home;