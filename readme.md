# kiira-services

Monorepo for Kiira's micro-services, cron jobs, and shared libraries.

## Identity Service

A micro-service responsibile for authentication/authorization for Kiira members, experts, and administrators. Abstracts 3rd-party identity service providers such as Firebase Authentication or Auth0.

### Aggregates and Bounded Contexts

- __Users__ - Handles use cases for user registration, profile and preferences management, and authorization. 

## Payments Service

A micro-service responsible for payment processing. Abstracts one or more payment processing services such as Stripe.

### Aggregates and Bounded Contexts

- __Billing__ - Handles use cases for transactional and recurring payments.

## Platform Service

A _macro_-service responsible for handling most of Kiira platform's use cases. As the bounded contexts grow in size, those contexts can be extracted into their own new micro-services. Abstracts 3rd-party services such as the cloud EHR system, Sendgrid, and Firebase.

### Aggregates and Bounded Contexts

- __Experts__ - Handles use cases for physician, clinician, and administrator data.
- __Members__ - Handles use cases for patient data management.
- __Scheduling__ - Handles use cases for scheduling/cancelling virtual and in-person appointments.
- __Notifications__ - Handles use cases for publishing and scheduling user notifications via device push, sms, email, etc..