# MDLab-Resource-Utilization-Platform

A **Full-Stack Lab Resource Utilization Platform** built using **React.js**, **Spring Boot**, and **PostgreSQL** for managing laboratory equipment, scheduling, utilization monitoring, and resource sharing.

---

# Getting Started

## Prerequisites

Before running the project, ensure you have the following installed:

- Java 21 (or the version required by the project) / Java 17
- Node.js & npm
- PostgreSQL
- Eclipse IDE (recommended for the backend)
- Maven
- Neon PostgreSQL database
- Docker Desktop
-   Maven 3.9+
-   brevo
-   Git
---

## Clone

``` bash
git clone https://github.com/shreya080527/Lab-Resource-Utilization-Platform
cd Lab-Resource-Utilization-Platform
```

## base url for render
```
https://lab-resource-utilization-platform.onrender.com/

```

## base url for vercel
```
https://lab-resource-utilization-platform.vercel.app/

```

## Environment Variables for backend

Create a `.env` file in the project root:

``` properties

  SPRING_DATASOURCE_URL: jdbc:postgresql://<neon-host>/neondb?sslmode=require

  SPRING_DATASOURCE_USERNAME: neondb_username

  SPRING_DATASOURCE_PASSWORD: neondb_password

  SPRING_MAIL_USERNAME= brevo_smtp_email

  SPRING_MAIL_PASSWORD= brevo_smtp_api_key

  APP_EMAIL_FROM= brevo_verified_mail

  JWT_SECRET= Jwt_secret key

```

## application.properties

``` properties
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/lab_resourse_db}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME:postgres}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:postgres}

spring.mail.username=${SPRING_MAIL_USERNAME:test@example.com}
spring.mail.password=${SPRING_MAIL_PASSWORD:test}
app.email.from=${APP_EMAIL_FROM:test@example.com}

jwt.secret=${JWT_SECRET:aGVsbG8td29ybGQtd2VsY29tZS10by1qd3Qtc2VjcmV0LWtleQ==}

server.port=${PORT:8080}

........

```

## Environment Variables for frontend

Create a `.env` file in the frontend folder :

```
 VITE_API_BASE_URL= render_url for backend

```

# Running the Frontend (React)

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

# Running the Backend (Spring Boot)

## Step 1: Enable Lombok

Navigate to the folder containing `lombok.jar` and run:

```bash
java -jar lombok.jar
```

Restart Eclipse after installation.

---

## Step 2: Enable Annotation Processing

In Eclipse:

```
Window
    → Preferences
        → Java Compiler
            → Annotation Processing
```

Enable:

- Annotation Processing
- Annotation Processing in Java Projects

---

## Step 3: Update Maven Project

Right-click the project:

```
Maven → Update Project
```

---

## Step 4: Configure PostgreSQL

Update your PostgreSQL credentials and database configuration inside:

```
application.properties
```

or

```
application.yml
```

depending on your project configuration.

---

## Step 5: Run the Application

Open

```
LabResourcePlatformApplication
```

and click **Run**.

---


## Build the Project

``` bash
mvn clean package -DskipTests
```

## Build Docker Image

``` bash
docker compose build
```

## Run Container

``` bash
docker compose up -d
```

## View Running Containers

``` bash
docker ps
```

## View Logs/ run project

``` bash
docker logs -f lab-platform
```

## Stop Container

``` bash
docker compose down
```

## Rebuild After Code Changes

``` bash
mvn clean package -DskipTests
docker compose up --build -d
```



# Authentication API

## User Roles

The application supports the following user roles:

```text
RESEARCHER
LAB_TECHNICIAN
LAB_MANAGER
DEPARTMENT_HEAD
INSTITUTION_ADMIN
SYSTEM_ADMIN
```

---

## 1. Register

**Method:** `POST`

**Endpoint**

```http
POST http://localhost:8080/api/auth/register
```

### Request Body

```json
{
  "username": "rahul",
  "email": "xyz@gmail.com",
  "password": "12345678",
  "role": "RESEARCHER",
  "department": "CS",
  "institution": "XYZ University"
}
```

### Response

```json
{
  "message": "Registration successful! Please check your email for OTP.",
  "email": "xyz@gmail.com"
}
```

An OTP will be sent to the registered email address.

---

## 2. Verify Email

**Method:** `POST`

**Endpoint**

```http
POST http://localhost:8080/api/auth/verify
```

### Request Body

```json
{
  "email": "xyz@gmail.com",
  "otp": "067263"
}
```

### Response

```json
{
  "message": "Email verified successfully!"
}
```

---

## 3. Login

**Method:** `POST`

**Endpoint**

```http
POST http://localhost:8080/api/auth/login
```

### Request Body

```json
{
  "email": "xyz@gmail.com",
  "password": "12345678"
}
```

### Response

```json
{
  "tokenType": "Bearer",
  "accessToken": "your_jwt_access_token"
}
```

### JWT Authentication

All protected endpoints require the JWT access token returned after login.

Include it in every request:

```http
Authorization: Bearer <your_jwt_access_token>
```

The JWT contains the authenticated user's:

- Email
- Username
- Role

The token remains valid for **30 days**, after which the user must log in again.

---

## 4. Resend OTP

**Method:** `POST`

**Endpoint**

```http
POST http://localhost:8080/api/auth/resend-otp
```

### Request Body

```json
{
  "email": "xyz@gmail.com"
}
```

### Response

```json
{
  "message": "OTP resent successfully!"
}
```

---

## 5. Request Password Reset

**Method:** `POST`

**Endpoint**

```http
POST http://localhost:8080/api/auth/reset-password-request
```

### Request Body

```json
{
  "email": "xyz@gmail.com"
}
```

### Response

```text
Reset OTP sent successfully!
```

---

## 6. Reset Password

**Method:** `POST`

**Endpoint**

```http
POST http://localhost:8080/api/auth/reset-password
```

### Request Body

```json
{
  "email": "xyz@gmail.com",
  "newPassword": "12345678",
  "otp": "814463"
}
```

### Response

```text
Password changed successfully!
```

---

## 7. Get User Details

**Method:** `GET`

**Endpoint**

```http
GET http://localhost:8080/api/auth/get-user-details
```

### Authentication

```http
Authorization: Bearer <your_jwt_access_token>
```

### Response

```json
{
  "id": 1,
  "username": "rahul",
  "email": "xyz@gmail.com",
  "role": "RESEARCHER",
  "emailVerified": true,
  "department": "CS",
  "institution": "XYZ University"
}
```

---

# Equipment Management API

The Equipment Management module provides APIs for creating, updating, deleting, and retrieving laboratory equipment.

> **Authentication Required**
>
> All endpoints in this section require a valid JWT access token.
>
> Include the following header with every request:
>
> ```http
> Authorization: Bearer <your_jwt_access_token>
> ```
>
> Some endpoints also require an equipment **ID** as a path variable.

---

## 1. Add Equipment

**Method:** `POST`

**Endpoint**

```http
POST http://localhost:8080/api/equipment/add-equipment
```

### Request Body

```json
{
  "serial": "13s34s3",
  "equipmentName": "MicroScope",
  "category": "Micro Biology",
  "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
  "institution": "Cluster University"
}
```

### Response

```json
{
  "id": 8,
  "serial": "13s34ss3",
  "equipmentName": "MicroScope",
  "category": "Micro Biology",
  "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
  "acquisitionDate": "2026-07-07T21:42:26.214146",
  "institution": "Cluster University",
  "status": "AVAILABLE",
  "addedBy": "zahiq Ibrahim"
}
```

---

## 2. Update Equipment

**Method:** `PUT`

**Endpoint**

```http
PUT http://localhost:8080/api/equipment/update-equipment/{id}
```

**Example**

```http
PUT http://localhost:8080/api/equipment/update-equipment/1
```

### Request Body

```json
{
  "equipmentName": "MicroScope",
  "institution": "Cam University"
}
```

### Response

```json
{
  "id": 1,
  "serial": "1334s3",
  "equipmentName": "ocilo",
  "category": "Micro Biology",
  "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
  "acquisitionDate": "2026-07-07T20:16:58.1351",
  "institution": "Cam University",
  "addedBy": "zahiq Ibrahim",
  "status": "AVAILABLE"
}
```

---

## 3. Delete Equipment

**Method:** `DELETE`

**Endpoint**

```http
DELETE http://localhost:8080/api/equipment/delete-equipment/{id}
```

**Example**

```http
DELETE http://localhost:8080/api/equipment/delete-equipment/7
```

### Response

```text
Equipment Deleted Successfully
```

---

## 4. Get All Equipment

**Method:** `GET`

**Endpoint**

```http
GET http://localhost:8080/api/equipment/get-all-equipments
```

### Response

```json
[
  {
    "id": 7,
    "serial": "13s34s3",
    "equipmentName": "MicroScope",
    "category": "Micro Biology",
    "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
    "acquisitionDate": "2026-07-07T21:36:06.588868",
    "institution": "Cluster University",
    "addedBy": "zahiq Ibrahim",
    "status": "RETIRED"
  }
]
```

---

## 5. Update Equipment Status

**Method:** `PUT`

**Endpoint**

```http
PUT http://localhost:8080/api/equipment/update-equipment-status/{id}
```

**Example**

```http
PUT http://localhost:8080/api/equipment/update-equipment-status/2
```

### Request Body

```json
{
  "status": "UNDER_MAINTENANCE"
}
```

### Response

```json
{
  "id": 2,
  "serial": "1334s3",
  "equipmentName": "MicroScope",
  "category": "Micro Biology",
  "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
  "acquisitionDate": "2026-07-07T21:08:52.749123",
  "institution": "Cluster University",
  "addedBy": "zahiq Ibrahim",
  "status": "UNDER_MAINTENANCE"
}
```

---

## 6. Get My Equipment

Returns all equipment created by the currently authenticated user.

**Method:** `GET`

**Endpoint**

```http
GET http://localhost:8080/api/equipment/get-my-equipments
```

### Response

```json
[
  {
    "id": 7,
    "serial": "13s34s3",
    "equipmentName": "MicroScope",
    "category": "Micro Biology",
    "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
    "acquisitionDate": "2026-07-07T21:36:06.588868",
    "institution": "Cluster University",
    "addedBy": "zahiq Ibrahim",
    "status": "RETIRED"
  }
]
```
# Booking Management API Documentation

## Authentication Requirements

The following APIs require a **Researcher Access Token**:

* Create Booking
* Calendar Data
* My Dashboard

For booking status modification:

* If a **Researcher** wants to cancel a booking request, pass the **Researcher Access Token**.
* If a **Lab Manager** wants to update the booking status, pass the **Manager Access Token**.

---

# 1. Create Booking

### Method

```
POST
```

### Endpoint

```
http://localhost:8080/api/bookings/create
```

### Request Body

```json
{
    "userId": 1,
    "equipmentId": 1,
    "startTime": "2026-07-09T10:00:00",
    "endTime": "2026-07-09T12:00:00"
}
```

### Response

```
Booking request submitted successfully. Awaiting Manager approval.
```

---

# 2. Create Booking - Conflict Check

When a requested booking slot conflicts with an active booking timeline, the request will automatically be added to the waitlist.

### Method

```
POST
```

### Endpoint

```
http://localhost:8080/api/bookings/create
```

### Request Body

```json
{
    "userId": 2,
    "equipmentId": 1,
    "startTime": "2026-07-09T10:30:00",
    "endTime": "2026-07-09T11:30:00"
}
```

### Response

```
Slot conflicting with an active timeline. Auto-added to the Waitlist.
```

---

# 3. Calendar Data

Returns the booking schedule for a specific equipment within the given time range.

### Method

```
GET
```

### Endpoint

```
http://localhost:8080/api/bookings/calendar?userId=2&start=2026-07-09T00:00:00&end=2026-07-09T23:59:59

?userId={userId}&start={startTime}&end={endTime}
```

### Request Body

```
None
```

### Response

```json
[
    {
        "id": 1,
        "equipment": {
            "id": 1,
            "serial": "13s34s3",
            "equipmentName": "MicroScope",
            "category": "Micro Biology",
            "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
            "acquisitionDate": "2026-07-08T14:05:09.306125",
            "institution": "Cluster University",
            "addedBy": "nani",
            "status": "AVAILABLE"
        },
        "user": {
            "id": 2,
            "username": "reseacher_r",
            "password": "$2a$12$PEGJqW3W7tL9Cs49PB/90.eYDyPjV/KbjjY1FAsBjVHzFLt.AIawO",
            "email": "onlinevoting630@gmail.com",
            "emailVerified": true,
            "verificationOtp": null,
            "otpGeneratedTime": null,
            "role": "RESEARCHER",
            "institution": "lbwe",
            "department": "Computer Science"
        },
        "startTime": "2026-07-09T05:30:00",
        "endTime": "2026-07-09T06:00:00",
        "status": "CANCELLED"
    },
    {
        "id": 3,
        "equipment": {
            "id": 2,
            "serial": "13s34s4",
            "equipmentName": "MicroScope",
            "category": "Micro Biology",
            "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
            "acquisitionDate": "2026-07-08T14:05:18.092768",
            "institution": "Cluster University",
            "addedBy": "nani",
            "status": "AVAILABLE"
        },
        "user": {
            "id": 2,
            "username": "reseacher_r",
            "password": "$2a$12$PEGJqW3W7tL9Cs49PB/90.eYDyPjV/KbjjY1FAsBjVHzFLt.AIawO",
            "email": "onlinevoting630@gmail.com",
            "emailVerified": true,
            "verificationOtp": null,
            "otpGeneratedTime": null,
            "role": "RESEARCHER",
            "institution": "lbwe",
            "department": "Computer Science"
        },
        "startTime": "2026-07-09T05:30:00",
        "endTime": "2026-07-09T06:00:00",
        "status": "CANCELLED"
    },
    {
        "id": 4,
        "equipment": {
            "id": 2,
            "serial": "13s34s4",
            "equipmentName": "MicroScope",
            "category": "Micro Biology",
            "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
            "acquisitionDate": "2026-07-08T14:05:18.092768",
            "institution": "Cluster University",
            "addedBy": "nani",
            "status": "AVAILABLE"
        },
        "user": {
            "id": 2,
            "username": "reseacher_r",
            "password": "$2a$12$PEGJqW3W7tL9Cs49PB/90.eYDyPjV/KbjjY1FAsBjVHzFLt.AIawO",
            "email": "onlinevoting630@gmail.com",
            "emailVerified": true,
            "verificationOtp": null,
            "otpGeneratedTime": null,
            "role": "RESEARCHER",
            "institution": "lbwe",
            "department": "Computer Science"
        },
        "startTime": "2026-07-09T05:30:00",
        "endTime": "2026-07-09T06:00:00",
        "status": "PENDING"
    }
]
```

---

# 4. Update Booking Status (Researcher / Lab Manager)

## Authorization Rules

### Researcher

A researcher can cancel their own booking request.

Required:

```
Researcher Access Token
```

Example action:

```
Cancel booking request
```

---

### Lab Manager

A lab manager can update the booking status.

Required:

```
Manager Access Token
```

Example actions:

```
Approve booking
Reject booking
Cancel booking
Update booking status
```

---

## Cancel Booking Request

### Method

```
POST
```

### Endpoint

```
http://localhost:8080/api/bookings/4/status?status=CANCELLED

/api/bookings/{bookingId}/status?status={status}
```

### Request Body

```
None
```

### Response

```
Booking status updated to CANCELLED. Waitlist verified.
```

---

# 5. My Dashboard - Booking and Waitlist Data

Returns the user's booking history and waitlist information.

### Method

```
GET
```

### Endpoint

```
http://localhost:8080/api/bookings/my-dashboard/2

/my-dashboard/{userId}
```

### Request Body

```
None
```

### Response

```json
{
    "bookings": [
        {
            "id": 1,
            "equipment": {
                "id": 1,
                "serial": "13s34s3",
                "equipmentName": "MicroScope",
                "category": "Micro Biology",
                "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
                "acquisitionDate": "2026-07-08T14:05:09.306125",
                "institution": "Cluster University",
                "addedBy": "nani",
                "status": "AVAILABLE"
            },
            "user": {
                "id": 2,
                "username": "reseacher_r",
                "email": "onlinevoting630@gmail.com",
                "role": "RESEARCHER",
                "institution": "lbwe",
                "department": "Computer Science"
            },
            "startTime": "2026-07-09T05:30:00",
            "endTime": "2026-07-09T06:00:00",
            "status": "CANCELLED"
        },
        {
            "id": 3,
            "equipment": {
                "id": 2,
                "serial": "13s34s4",
                "equipmentName": "MicroScope",
                "category": "Micro Biology",
                "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
                "acquisitionDate": "2026-07-08T14:05:18.092768",
                "institution": "Cluster University",
                "addedBy": "nani",
                "status": "AVAILABLE"
            },
            "user": {
                "id": 2,
                "username": "reseacher_r",
                "email": "onlinevoting630@gmail.com",
                "role": "RESEARCHER",
                "institution": "lbwe",
                "department": "Computer Science"
            },
            "startTime": "2026-07-09T05:30:00",
            "endTime": "2026-07-09T06:00:00",
            "status": "CANCELLED"
        },
        {
            "id": 4,
            "equipment": {
                "id": 2,
                "serial": "13s34s4",
                "equipmentName": "MicroScope",
                "category": "Micro Biology",
                "description": "ESAW 1125x Student Compound Biological School Microscope with Prepared Glass Slides (Magnification: 100x to 1125x)",
                "acquisitionDate": "2026-07-08T14:05:18.092768",
                "institution": "Cluster University",
                "addedBy": "nani",
                "status": "AVAILABLE"
            },
            "user": {
                "id": 2,
                "username": "reseacher_r",
                "email": "onlinevoting630@gmail.com",
                "role": "RESEARCHER",
                "institution": "lbwe",
                "department": "Computer Science"
            },
            "startTime": "2026-07-09T05:30:00",
            "endTime": "2026-07-09T06:00:00",
            "status": "PENDING"
        }
    ],
    "waitlistEntries": []
}
```

---

# API Authorization Summary

| API                    | Researcher Access Token | Manager Access Token |
| ---------------------- | ----------------------- | -------------------- |
| Create Booking         | Required                | Not Required         |
| Calendar Data          | Required                | Not Required         |
| My Dashboard           | Required                | Not Required         |
| Cancel Booking Request | Required                | Not Required         |
| Approve Booking        | Not Required            | Required             |
| Reject Booking         | Not Required            | Required             |
| Update Booking Status  | Not Required            | Required             |

---

# Idle Equipment Report Logic

## Overview

The Idle Equipment Report identifies equipment that has been underutilized during a given reporting period.

The system calculates:

```
Idle Hours = Available Hours - Booked Hours
```

Equipment is considered idle when its idle hours exceed the configured threshold.

---

# Flowchart

```
                 START
                   |
                   v
      Input Parameters Received
      -------------------------
      start date
      end date
      threshold hours
                   |
                   v
      Fetch Active Equipment
      (Status != RETIRED)
                   |
                   v
          Loop Through Equipment
                   |
                   v
        Check Equipment Created Date
                   |
                   v
       Is Created Date After Start?
              /             \
            YES              NO
             |                |
             v                v
 Set Effective Start Date  Use Report Start Date
 = Equipment Created Date  as Effective Start Date
             \                /
              \              /
               v            v
        Is Effective Start After End?
              /             \
            YES              NO
             |                |
             v                v
       Skip Equipment   Calculate Utilization
                             |
                             v
                 Get Available Hours
                 Get Booked Hours
                             |
                             v
                 Calculate Idle Hours

                 Idle Hours =
              Available Hours - Booked Hours

                             |
                             v
             Is Idle Hours > Threshold?
                    /          \
                  NO            YES
                   |              |
                   v              v
              Ignore       Create Idle Record
              Equipment          |
                                  v
                         Add To Idle List
                                  |
                                  v
                         More Equipment?
                           /        \
                         YES         NO
                          |           |
                          v           v
                    Repeat Loop   Build Response
                                      |
                                      v
                              Return Idle Report
                                      |
                                      v
                                    END
```

input :

```
Start:      21-06-2026 00:00:00
End:        21-07-2026 23:59:59
Threshold:  5 hours

```
for computers equipment :

```
 "createdAt": "2026-07-13T22:45:07.138975" -->  Created At: 13-07-2026 22:45:07
```
Duration:

```
13-07-2026 22:45:07
        to
21-07-2026 23:59:59

avail hrs =193.23 hours
```
idle report :

```
Available Hours = 193.25
Booked Hours    = 12.016

Idle Hours      = 193.23 - 12.016
                = 181.21 hours

```

# Response Structure

Example response:

```json
{
    "periodStart": "2026-06-21T00:00:00",
    "periodEnd": "2026-07-21T23:59:59",
    "thresholdHours": 5.0,
    "idleEquipment": [
        {
            "equipmentId": 2,
            "equipmentName": "cpu",
            "serial": "67675",
            "createdAt": "2026-07-21T18:48:05.723702",
            "department": "cse",
            "bookedHours": 0.0,
            "availableHours": 5.183333333333334,
            "idleHours": 5.183333333333334,
            "utilizationPercentage": 0.0,
            "status": "AVAILABLE"
        },
        {
            "equipmentId": 1,
            "equipmentName": "computers",
            "serial": "23567",
            "createdAt": "2026-07-13T22:45:07.138975",
            "department": "cse",
            "bookedHours": 12.016666666666666,
            "availableHours": 193.23333333333332,
            "idleHours": 181.21666666666664,
            "utilizationPercentage": 6.218733827841987,
            "status": "AVAILABLE"
        }
    ],
    "totalIdleCount": 2
}
```