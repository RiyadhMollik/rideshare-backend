# Ride Sharing App Backend

 Ride Sharing backend is responsible for handling various features of the app, including different types of vehicle rental, ride sharing/car pooling, parcel delivery, chat functionality, managing user rides, wallet integration, review system, and bidding options.

## Features

1. **Different Type Vehicle Rental**: Users can rent various types of vehicles, such as cars, bikes, or scooters, based on their preferences and needs.

2. **Share Ride/Car Pool**: The app allows users to share rides with others who are traveling in the same direction, reducing costs and promoting a greener environment.

3. **Parcel Delivery**: Users can request parcel delivery services through the app, enabling them to send packages conveniently and securely.

4. **Chat**: The app provides a chat functionality that allows users to communicate with each other, making it easier to coordinate rides, deliveries, or any other inquiries.

5. **My Rides**: Users can view and manage their past and upcoming rides, including details such as pickup/drop-off locations, driver information, and ride status.

6. **Wallet**: The app integrates a wallet system, enabling users to make cashless payments for rides, deliveries, or any other services offered within the app.

7. **Review**: Users can provide feedback and ratings for drivers, helping to maintain a reliable and trustworthy community within the ride sharing app.

8. **Bidding Option**: The app includes a bidding feature, allowing users to bid on rides or deliveries, providing them with more flexibility and potentially lower costs.

## Setup Guide

**Change All .env Variables with Your Values**

**Obtain Firebase Admin Service Account File**

To obtain the service account key for Firebase Admin, follow these steps:

1. Go to the Firebase Console.
2. Select your project.
3. In the project settings, navigate to Service accounts.
4. Click on "Generate new private key". This will download a JSON file with your service account credentials.

**Create OAuth 2.0 Credentials**

To create OAuth 2.0 credentials, follow these steps:

1. Go to the Credentials Page.
2. In the left-hand menu, click on "APIs & Services" > "Credentials."
3. Click on "Create Credentials" and select "OAuth 2.0 Client IDs."
4. Configure the OAuth consent screen by providing the necessary information.
5. Click "Save and Continue."
6. Create the OAuth 2.0 Client ID by choosing "Web application" as the application type and providing a name for your client.
7. Add the URLs where your app is hosted under "Authorized JavaScript origins."
8. After filling out the form, click "Create."
9. Copy the provided GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET values for your backend configuration.

