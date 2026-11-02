Blood Donation Application

1. Objective
The Blood Donation Application aims to create a user-friendly platform that facilitates blood donation activities. The application will connect donors with those in need of blood, promoting a seamless and efficient donation process.
The application will include features for use(donor) registration, blood donation requests, donor management, content management, and role-based access control. It will be built using the MERN stack (MongoDB, Express.js, React, Node.js).
Ensure the Following things to get 100% mark ( No mark will contain)
Include at least 20 meaningful commits on the client side & 12 meaningful commits on the server side with descriptive messages.
Include a README file with the project name, purpose, live URL, key features, and any npm packages you have used.
Secure Firebase configuration keys using environment variables.
Secure your MongoDB credentials using the environment variable.
Create a design that encourages recruiters. Color contrast should please the eye & ensure that the website has proper alignment, space, and the website does not express gobindo design. 
If we found your project similar to any project of your module / conceptual / assignment. You will get 0  and may miss the chance of any upcoming reward. 
Deployment Guideline
If your Deployment is not okay you will get 0 and may miss the chance of our upcoming rewards. 
Ensure that your server is working perfectly on production and not throwing any CORS / 404 / 504 Errors.  
Ensure that your Live Link is working perfectly and that it is not showing errors on Landing in your system.  
⚠️ ensure that the page doesn't throw any error on reloading from any routes.  
⚠️ Add your domain for authorization to Firebase if you use Netlify / surge / Vercel
⚠️ Logged in User must not  redirect to Login on reloading any private route


2. User Roles and Permissions
2.1 Role Management
Admin 🌐: Has access to all features, including user management, donation requests, and content management.
Donor🩸: Can register, view donation requests, respond to them, and maintain their own profile.
Volunteer 🤝: Can create and manage donation requests.
💡 Make a user admin by editing from database


3. User Authentication(public)
3.1 Registration
The application will have a registration page from where users can register an account for himself. When a new user will register an account by default the role of the user will be “donor”. [ Do not enforce the email verification method and forget & reset password method, as it will inconvenience the examiner. If you want, you can add it after receiving the assignment result. ]. Registration form will have the following input fields


email
name
avatar(use imageBB to upload the user avatar)
blood group(a selector with option A+, A-, B+, B-, AB+, AB-, O+, O-)
district(select option)
upazila(select option)
password
confirm_password
💡 status: Every user will have a default status “active”. Admin can block a user. Then the status for the user will be “blocked”. We will talk more about this feature in admin section



 💡 You will find data for the district and upazila in the resources section. Social login is not required; LifeDrop additionally supports Google sign-in through Firebase. New Google users complete their donor profile (blood group, district, and upazila/thana) before account creation.

 For Dhaka district, the location selector also includes the 49 Dhaka Metropolitan Police thanas alongside the district's five official upazilas so Dhaka city residents can select their local thana.


3.2 Login
Application will have a login page from where registered users can log in using their email and password. Users can navigate to the registration page from the login page and vise versa


4. Dashboard(private🔒)
All of the dashboard layout will have sidebar not navbar on the top.The dashboard layout has to be fully responsive.
Profile Page
Route: /dashboard/profile
Every user(admin, donner, or volunteer) will have a profile page. From where the user is able to see his name, email, avatar, address(district, upazila), blood group and able to update profile information. [ use a form to show all the information and keep an edit button on top of the form. Initially the form will not be editable. While the edit button will be clicked then the form will be editable and will appear a save button to save updated data to the database. After saving the updated data the form will go back to its initial state. It means again an edit button will appear on top of the form and form will be not editable. Keep in mind, the email will not be editable even after clicking on the edit button.]
4.1 Donor Dashboard
Dashboard Home page 🏠


Route: /dashboard
This page will display a welcome message with the user’s name(who has logged in as donor)
Below the welcome section donor will see his maximum 3 recent donation requests, those requested by himself. For example, if you are a donor then if you come to this page you will see your 3 recent donation requests (show as tabular format). If the user has not made any donation request yet this section will be hidden.
Every donation request will have the data mentioned below
recipient name
recipient location(where donor will need to go to donate the blood for the blood recipient. This row only shows the district and upazila which was provided while the request was created. look at the create donation request form. you will find to input: recipient district, recipient upazila)
donation date
donation time
blood group (A+, A-, B+, B-, AB+, AB-, O+, or O-)
donation status(pending, inprogress, done, canceled) - donor will find done and cancel button only while the donation status is inprogress. Then the status can be changed from inprogress to done, or inprogress to cancled. While the status will be done, or canceled both(done and canceled) buttons will be hidden again.
donor information - while the donation status will be inprogress the donation will have donor information(name, email)
edit button to edit the donation request(when click the button donor will be redirected to a page from where the donation request can be edit and update by clicking on update donation request button)
delete button to delete the donation request(will show a confirmation modal before deleting and by confirming the donation request will be deleted)
view button to go into the donation request details page(you will find details about this page below)
Below the 3 recent donation requests the donor will see a “view my all request” button. When the user clicks on the button, the user(donor) will be redirected to the “My Donation Requests” page. (Note: you will find details about this page below)
My Donation Requests Page🩸


Route: /dashboard/my-donation-requests
In this page user(donor) will see all of his donation requests those was requested by himself in a tabular format (same like “recent donation request” section table in the “Dashboard Home Page”)
The table will have the same content as “recent donation request” section in the “Dashboard Home Page”
In addition the table will have a pagination feature. (Pagination is part of the challenge requirement. If you don’t implement the pagination feature then show all data in a single table)
In addition the table will have a filtering option(”pending”, “inprogress”, “done”, “canceled”) based on the donation request(you will find more details about how this donation status works in the whole requirement. So read it very carefully)
Create Donation Request Page 🆕


Route: /dashboard/create-donation-request
This page will have a form with the following input fields
requester name(read only - name of the logged in user)
requester email(read only - email of the logged in user)
recipient name
recipient district(select option)
recipient upazila(select option)
hospital name(where the donor will go to donate blood - like: Dhaka Medical College Hospital)
full address line(like: Zahir Raihan Rd, Dhaka)
blood group(a selector with option A+, A-, B+, B-, AB+, AB-, O+, O-)
donation date
donation time
request message(requester will write, why he need blood in this input field in details)
donation status(this will not be in the donation request form. you will add the status as pending as default value. Don’t add any input field for status)
request button (form will have a request button and clicking on the button a donation request will be created.)
💡 Blocked user is not able to create any donation request. Only the active user is able to create a donation request.


4.2 Admin Dashboard
Dashboard Home Page 🏠


Route: /dashboard
Will have the same welcome section like the “Donor Dashboard Home Page” welcome section
Below the welcome section will have 3 featured cards of the statistics. Every card will have a relevant icon, count number, and title. Design it on your own.
total user(Donors)
total funding(users are able to donate a little money to help these organizations. We will talk about how to donate money in the bonus section). Look at the challenges requirement section. Showing total funds is part of the challenge requirement.
total blood donation request
All Users Page 👤


Route: /dashboard/all-users
All users data will be shown in tabular format in this page. You can implement pagination(optional) to the table.
The table will have a filtering option(”active”, “blocked”) based on the user status.
In every table row will have
user avatar
user email
user name
user role
user status
a block button to block the user while the user status is “active”(clicking on the button admin is able to block the user. Then the user status will be “blocked”)
a unblock button to unblock the user while the user status is “blocked”(clicking on the button admin is able to unblock the user. Then the user status will be “active” again)
a make volunteer button to make a user from donor to volunteer. By clicking the button admin is able to give volunteer role to a user/donor
a make admin button to make a user from donor, or volunteer to admin. By clicking the button admin is able to give admin role to a user.
💡 You can use a three dot menu button with dropdown to manage all of the action button. It will be nicer to look at.


All Blood Donation Request Page🩸


Route: /dashboard/all-blood-donation-request
This page will have the same features and content like “My Donation Requests Page” from the donor dashboard. That means the admin will have the same privilege as a donor and be able to do anything that a donor can from his dashboard → “My Donation Requests Page”.
💡 The only difference is a donor from his dashboard is able to manage only his own donation requests. But the admin is able to manage all users' donation requests.


4.3 Volunteer Dashboard
Dashboard Home Page 🏠


Route: /dashboard
Will be the same page like Admin Dashboard → Home Page
Manage Donation Requests Page🩸


Route: /dashboard/manage-donation-requests


Volunteers can see all donation requests and filter by status. Their request-management permissions are:

Can update any request to a valid donation status (pending, inprogress, done, or canceled)
Can edit and delete only requests they created
Cannot create donation requests or manage users

The backend must verify request ownership before allowing volunteers to edit or delete a request.


5. Home Page(public)
Route: /
Navbar → will have a logo, donation requests, login, link before logged in. and will have a logo, donation requests, funding links and user avatar with dropdown(dashboard, logout button) after logged in.
Banner → will have a heading with a “Join as a donor” and “Search Donors” button
Clicking on the “Join as a donor” button will redirect the user to registration page
Clicking on the “Search Donors” button will redirect the user to search page
Featured section → make it from your own thinking. It should be relevant with the website.
Contact Us section → will have a contact form and contact number
Footer → make the footer relevant with the website theme and add useful links in the footer as well


6. Search page(public)
will have a search form with following input fields
blood group(a selector with option A+, A-, B+, B-, AB+, AB-, O+, O-)
district(select option)
upazila(select option)
search button
By default the search page will not have any donor data. After clicking on the search button by filling the search form donors list will be shown below based on the search. The view of this section depends on your website theme.


7. Blood Donation requests(public)
This page will only show all of the pending donation requests(card or tabular view)
Every donation request will have the following things
recipient name
location
blood group
date
time
view button
By clicking the view button the user is able to go to the details page of the donation request. This page is private. If the user is not logged in then redirect the user to the login page


8. Blood Donation Request Details Page(private🔒)
This page will have all of the information that was provided during creation of a donation request. (you will find on the → Create Donation Request Page)
Below that information will have a donate button. And by clicking on the button will open a modal with a form and confirm button
The form will have following input fields
donor name(read only - logged in user name)
donor email(read only - logged in user email)
By confirming donation the status for the donation will be changed pending to inprogress
UI Design Requirements: 

Unique Design: First, decide what kind of website you want to make. Then, search online or check out websites like ThemeForest to get ideas for the design. But remember, your website idea shouldn't be similar to any projects you've done before or to any examples in our modules or conceptual sessions.
You can also look for free resources on blogs to help with your website. 

Keep the main heading style (font, size, color) consistent across all sections.

Keep paragraph spacing balanced and text easily readable.
Maintain uniform image sizes and spacing.
     4.Use the same button style as on the home page.
Ensure good spacing and proper alignment.
Navbar, Keep the heading/logo same style and size as on the home page.
Use a grid layout with equal image sizes.
Keep all cards equal height and width (especially in services, projects, or products section)
Use the new X logo instead of the old Twitter bird to match the latest rebrand
Responsiveness: Make it responsive for all devices, including mobile, tablet, and desktop views. 
Dashboard UI Requirements: 
Responsive design for mobile and tablet screens
Consistent color theme
Full-width dashboard
Charts and graphs for quick data visualization
User profile section

Resources: 
https://uiverse.io/ 
https://devmeetsdevs.com/ 
https://bootcamp.uxdesign.cc/free-images-and-resources-collection-for-website-c77f2fc46ce5 
https://themeforest.net/?srsltid=AfmBOopTj6PNz51iuV2YJXUtBP8nt19_zT5LG2dToAjIHQqzNCzregn0 
https://codecanyon.net/?srsltid=AfmBOooRoUfeK7lOROpchCuA4hPVj5P9WRmtDQJ9K0E6Yhf4VTrHhXKt 
Challenges Requirements


9. Funding Page(private🔒)
This page will show all of the funds made by the users. Show in tabular form.
Each funding will have the name of the user who has given the fund, fund amount, funding date
Keep a give fund button to give funding on this page at the top. By clicking the button users will be able to  give fund for the organization(integrate stripe payment method for this)
Showing total funds on admin and volunteers dashboard is part of a challenging task.


10. JWT
Implement JWT to protect private APIs with custom JWT or firebase


11. Show pagination where it is necessary or mentioned to implement.

Resources
Use this github repository to find all of the districts and upazilas data: https://github.com/nuhil/bangladesh-geocode


Optional Tasks
You can implement any tasks from the following:

Added animation on  your website using  (framer motion, or aos)
Download search results as pdf from Search page. Explore how to generate pdf from html and download
Implement daily, weekly, monthly donation request in chart in the admin dashboard home page

Remember to maintain a consistent design and user experience throughout your website. Tailor these additional features and recommendations to suit the unique characteristics and goals of your Polling and Survey application. 🚀✨
