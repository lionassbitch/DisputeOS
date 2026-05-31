# DisputeOS - Project TODO

## Core Infrastructure
- [x] Database schema: users, credit_reports, dispute_candidates, dispute_letters, mail_packets, audit_logs
- [x] File storage integration for PDF uploads
- [x] Environment variables configuration
- [x] Role-based access control (user/admin)

## Backend - Credit Report Processing
- [x] Secure PDF upload endpoint
- [x] PDF text extraction
- [x] AI-powered dispute candidate identification (bureaus, accounts, inquiries, collections, balances, payment status, furnishers, inconsistencies)
- [x] Dispute candidate creation with all required fields (bureau, furnisher, account name, issue type, dispute reason, confidence score, evidence checklist, risk/compliance flag, recommended round, deadline status)

## Backend - Dispute Workflow
- [x] User dispute approval workflow (approve/reject/edit)
- [x] Customized dispute letter generation
- [x] Letter preview and editing
- [x] Compliance validation (never send false/fabricated/unsupported disputes)

## Backend - Mail & Delivery
- [x] Mock certified mail provider adapter
- [x] Provider-ready architecture (Click2Mail, PostGrid, Lob, Postalytics)
- [x] Mail proof storage (letter PDF, recipient, tracking number, date sent, deadline, delivery result, response)
- [x] Mail queue management

## Backend - Scheduling & Admin
- [x] Automated follow-up round scheduling after response windows
- [x] Audit log table and procedures
- [x] Admin user management
- [x] Admin dispute pipeline overview

## Frontend - Design & Layout
- [x] Global styling (elegant, polished financial SaaS design)
- [x] Dashboard layout with sidebar navigation
- [x] Responsive design

## Frontend - User Features
- [x] User dashboard (overview of disputes, reports, deadlines)
- [x] Credit report upload page
- [x] Dispute pipeline dashboard (candidate review UI)
- [x] Dispute candidate detail view (all fields displayed)
- [x] Dispute approval workflow UI
- [x] Letter preview/edit/approve screen
- [x] Mail queue screen
- [x] Deadline calendar

## Frontend - Admin Features
- [x] Admin dashboard
- [x] Audit log viewer
- [x] User management
- [x] Dispute pipeline overview (all users)
- [x] Mail queue management (admin)
- [x] Compliance disclaimer page

## Deployment
- [ ] Deploy live website
- [ ] Push source code to GitHub repository
