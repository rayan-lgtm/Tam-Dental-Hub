# Recon map: LabStar / 3Shape LMS (web, cloud)

Scope: the case lifecycle. A clinic sends a case (Rx + scans or a physical impression),
the lab logs it, runs it through its production steps against a due date, ships it
and invoices it. Plus the doctor-facing portal.
For: a product to sell to dental labs (SaaS).
Date: 2026-11-03
Status: **draft v0, public sources only.** Screens and states are inferred and need
confirming in the walkthrough (see "Next: the walkthrough" at the bottom).

## Key fact

These are not two apps. **3Shape acquired LabStar in January 2023** and LabStar
became **3Shape LMS** (Lab Management Software), sold in two tiers:

- **Essentials** (free): case management, link to 3Shape Dental System, digital file storage.
- **Premium** (paid, from about $79/month for 100 cases): client management, multi-step
  production lines with barcodes, integrated billing, a price book per client,
  one-click invoicing, card payments, production traceability.

**3Shape Unite** is the separate clinic-to-lab ordering platform: an order form with
built-in chat and a directory of 1,000+ labs. We copy its *order-and-chat pattern*,
not its network.

## Sources

Fetching pages was blocked by this session's network policy. Everything below comes
from search-result summaries, so it is all secondhand. 3shape.com,
community.3shape.com and g2.com need to be allowed to read the primary pages.

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | 3Shape LMS product page | https://www.3shape.com/en/software/lms | tiers, Premium feature list, price from $79/mo |
| 2 | 3Shape help center, LMS section | https://community.3shape.com/en/support/all-products | article titles: case entry, case flow, case record, voiding a case, case notes, case flags, user permissions, send case to Dental System |
| 3 | Help: price management | https://community.3shape.com/en/support/all-products/3shape-lms/settings--product-catalog/price-management | a price book is assigned from the client or manufacturer profile; the product catalog lives under Settings |
| 4 | 3Shape acquires LabStar | https://3shape.com/en/press/2023/3shape-acquires-labstar | LabStar becomes LMS; pricing unchanged at the time |
| 5 | Two new lab solutions (2023) | https://3shape.com/en/press/2023/dental-labs-can-now-do-more-digitally-with-new-3shape-solutions | Essentials vs Premium |
| 6 | 3Shape Unite launch | https://www.3shape.com/-/media/files/press-release-pdf/2021/3shape-launches-3shape-unite-a-collaborative-platform.pdf | order form with chat, lab directory |
| 7 | LabStar CEO article (DentistryIQ) | https://www.dentistryiq.com/dentistry/prosthodontics-and-laboratory/article/16359622/dentists-can-expect-good-things-from-cloud-based-dental-lab-software | portal: doctors enter cases, print slips, pay invoices, UPS/FedEx tracking links |
| 8 | LabStar upgrade (DPR) | https://dentalproductsreport.com/view/labstar-upgrades-services-better-lab-management | online Rx, invoices and statements, card payment, shipment tracking |
| 9 | LabStar 2.0 (Aegis) | https://www.aegisdentalnetwork.com/news/2016/11/17/LabStar-Announces-Biggest-Upgrade-Ever | online Rx, scheduling, shipping, secure messaging, CRM, production line |
| 10 | Lab blog: organizing cases | https://whatcomdentallab.com/2022/06/08/dental-lab-management-101-organizing-cases/ | real usage: pan numbers, printed daily due list, statements |
| 11 | Tutorial videos | https://www.youtube.com/watch?v=SBBuzE9uQ2A , https://www.youtube.com/playlist?list=PLBxqDcbZUR97zFe0BD_StpxlrBeGNOXAL | order entry and case management walkthroughs; **watch with the user** |
| 12 | Reviews | https://www.g2.com/products/labstar/reviews | for /replica-entrepreneur later |
| 13 | The user's own account | — | walkthrough pending; **check the terms first** (see below) |

## Core loop

A case comes in (digital scan, portal Rx or a physical pan at the front desk), gets a
due date and a production route, moves step by step on a barcode scan, ships on
time, and turns into an invoice the doctor pays online.

## Screens

Lab side, then the doctor portal. "states seen" lists the states we expect to see;
nothing is confirmed until the walkthrough.

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Sign in | /login | lab staff and doctors sign in | form, SSO | default, error, locked |
| S02 | Production dashboard | home after sign-in | live overview: due today, overdue, by status and department | stat tiles, case table, filters | empty, filled, loading |
| S03 | Case list and search | nav "Cases" | find any case by pan #, patient, doctor or barcode | search, filter bar, table, scan input | empty, filled, no results |
| S04 | New case entry | "New case" button | log a case: client, doctor, patient, pan #, items, teeth, shade, due date, files, flags | client picker, tooth chart, item rows, date picker, uploader | blank, validation error, saved |
| S05 | Case record | open a case | all of a case: items, files, notes, step history, invoice, shipping | tabs, timeline, file list, notes | active, on hold, shipped, voided, remake |
| S06 | Digital intake inbox | nav "Inbox" | scans and portal orders waiting to be accepted into cases | list, file preview, accept/reject | empty, new items, error |
| S07 | Production board | nav "Production" | cases by department, technician or step | kanban/columns, cards, filters | empty, filled, overdue highlighted |
| S08 | Scan station | nav "Scan", or a scanner on any page | scan a barcode to check a case into or out of a step | big scan input, last-scanned card | idle, success, wrong step, unknown barcode |
| S09 | Due and shipping list | nav "Shipping" | today's due list (printable) and batch shipping with tracking #s | table, checkboxes, carrier input, print | empty, filled |
| S10 | Print: work ticket / label | case > Print | paper ticket with a barcode that travels in the pan | print layout | — |
| S11 | Clients | nav "Clients" | practices and their doctors | table, search | empty, filled |
| S12 | Client profile | open a client | contacts, doctors, price book, cases, balance, portal access | tabs, form | new, filled |
| S13 | Invoices | nav "Billing" | invoices created on ship; list and detail | table, invoice view, PDF | draft, sent, paid, overdue, void |
| S14 | Statements | Billing > Statements | monthly statement per client | table, PDF, send | empty, filled |
| S15 | Record payment | invoice/client > Payment | record a cheque, cash, transfer or card payment and apply it | form, allocation table | default, error |
| S16 | Settings: product catalog | Settings > Products | products and services, default steps and turnaround | table, editor | empty, filled |
| S17 | Settings: price books | Settings > Prices | price lists, assigned per client | table, editor | — |
| S18 | Settings: users and permissions | Settings > Users | staff accounts, roles, departments | table, role editor | — |
| S19 | Settings: lab profile, case flags, departments | Settings | lab details, flags (rush, remake...), departments | forms | — |
| S20 | Portal: home | doctor signs in | the doctor's open and past cases | case list, status chips | empty, filled |
| S21 | Portal: new Rx | Portal > New case | send a case: patient, items, teeth, shade, due date, upload scans, print a slip for a physical impression | Rx form, tooth chart, uploader | blank, uploading, sent |
| S22 | Portal: case detail | open a case | status, ETA, tracking link, messages with the lab | timeline, chat | in production, shipped, delivered |
| S23 | Portal: billing | Portal > Billing | invoices and statements, pay by card | table, pay button | nothing due, due, paid |
| S24 | Case messages | case > Messages (both sides) | chat about one case, with attachments | thread, composer | empty, unread |

## Flows

```
F01 Doctor sends a digital case
    S20 -> S21 (fill Rx, upload STL/PLY) -> sent -> S06 lab accepts -> S05
    happy path clicks: ~8 (to verify)
    edge: huge files, upload drops, missing tooth/shade, doctor not linked to a client
F02 Front desk logs a physical impression
    S04 (pick client, scan or type the pan #, add items, due date) -> S10 print ticket
    happy path clicks: ~10 (to verify)
    edge: duplicate pan #, rush flag, due date on a holiday
F03 Scan comes in from an intraoral scanner
    S06 inbox -> case pre-filled from the product catalog -> accept -> S05
    edge: unknown doctor, order matches no product
F04 Case moves through production
    S08 scan -> step done -> next step's queue on S07 ... -> QC -> ready to ship
    edge: scanned at the wrong step, on hold, remake sent back to a step
F05 Ship the day's cases
    S09 due list -> select -> carrier + tracking # -> shipped -> invoice created (S13)
    edge: partial shipment (try-in), case not passed QC
F06 Get paid
    S13 invoice -> S14 monthly statement -> S23 doctor pays by card, or S15 lab records payment
    edge: part payment, credit note for a remake, refund
F07 Remake or void
    S05 -> mark as remake (reason, who pays) or void -> history kept
F08 Doctor checks on a case
    S20 -> S22 status, ETA, tracking link, message the lab (S24)
F09 Set up a new client
    S11 -> S12 add the practice and doctors -> assign a price book -> invite to the portal
F10 Set up the lab
    S19 lab profile -> S16 products and steps -> S17 price books -> S18 users
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, danger | default, hover, focus, disabled, loading | all |
| Data table | sortable, selectable, dense | empty, loading, filled, no results | S02 S03 S09 S11 S13 S14 S16 S17 S18 S20 S23 |
| Filter bar | status, date range, client, department, technician | — | S02 S03 S07 S13 |
| Status chip | received, in production, on hold, QC, shipped, delivered, remake, void | — | everywhere |
| Due date badge | on time, due today, overdue, rush | — | S02 S03 S05 S07 S20 |
| Tooth chart | FDI and Universal numbering, single tooth, bridge span | none, selected, missing | S04 S21 |
| Shade picker | VITA classical, 3D-Master, custom | — | S04 S21 |
| File uploader | drag-drop, large files, resumable | idle, uploading %, done, failed | S04 S06 S21 S24 |
| 3D preview | STL/PLY viewer | loading, ready, unsupported | S05 S06 |
| Barcode input | always-on keyboard-wedge listener | idle, success, error | S03 S08 |
| Kanban column / case card | by step, department, technician | normal, overdue, rush | S07 |
| Timeline | case events | — | S05 S22 |
| Chat thread | per case | empty, unread | S24 |
| Print layouts | work ticket, label, invoice, statement, due list | — | S10 S13 S14 S09 |
| Money input / totals | currency, tax | — | S13 S15 S17 |
| Modal, toast, side nav, top bar | — | — | all |

## Inferred data model

```
Lab          id, name, address, tax_id, currency, timezone, plan
             evidence: multi-tenant SaaS, LMS subscription articles     confidence: high
User         id, lab_id, name, email, role (admin|front_desk|technician|billing), department_id
             evidence: help "Granting user access and assigning permissions"   confidence: high
Department   id, lab_id, name (model, die, CAD, milling, porcelain, QC...)
             evidence: review mentions boards by department                     confidence: medium
Client       id, lab_id, practice_name, address, phone, price_book_id, terms, balance
             evidence: help "price management": price book set on the client profile   confidence: high
Doctor       id, client_id, name, license_no, email, portal_user_id
             evidence: portal is for doctors                                    confidence: high
Patient      id, lab_id, name or initials, external_ref (minimal: this is PHI)
             evidence: case entry                                               confidence: medium
Case         id, lab_id, client_id, doctor_id, patient_id, pan_no, barcode, status,
             received_at, due_at, ship_by, shipped_at, rush, flags[], remake_of_id, voided_at, source (portal|scan|front_desk)
             evidence: help "Case entry", "Case record", "Voiding a case", "Defining case flags"   confidence: high
CaseItem     id, case_id, product_id, teeth[], shade, material, qty, unit_price, notes
             evidence: Rx forms, price books                                    confidence: high
Product      id, lab_id, name, category, default_turnaround_days, route_id
             evidence: "Settings > Product catalog"                             confidence: high
Route        id, product_id, steps[] (order, department_id, name, est_minutes)
             evidence: "multi-step production lines"                            confidence: medium
CaseStep     id, case_id, step_name, department_id, technician_id, started_at, done_at, status
             evidence: barcode production tracking, "production traceability"   confidence: medium
PriceBook    id, lab_id, name; PriceBookEntry: price_book_id, product_id, price
             evidence: help "price management"                                  confidence: high
Attachment   id, case_id, kind (scan|photo|rx|other), filename, size, storage_key
             evidence: "secure digital file storage"                            confidence: high
Message      id, case_id, author_id, body, attachments, read_at
             evidence: Unite order form chat, LabStar "secure doctor communication"   confidence: high
CaseEvent    id, case_id, type, actor_id, at, data (the audit trail)
             evidence: case history, traceability                               confidence: medium
Shipment     id, lab_id, carrier, tracking_no, shipped_at; case_ids
             evidence: UPS/FedEx tracking links                                 confidence: high
Invoice      id, lab_id, client_id, case_id, number, status, issued_at, due_at, subtotal, tax, total
             evidence: "one-click invoicing", invoice created on ship           confidence: high
Payment      id, client_id, amount, method, ref, received_at; allocations to invoices
             evidence: card payment in the portal                               confidence: high
Statement    id, client_id, period, opening, charges, payments, closing
             evidence: statements in the portal                                 confidence: high
```

Relationships: Lab 1-n User, Client, Product, PriceBook. Client 1-n Doctor, Case, Invoice.
Case 1-n CaseItem, CaseStep, Attachment, Message, CaseEvent. Product 1-1 Route.
Shipment n-n Case. Invoice 1-n Payment allocations.

## Feature matrix

See `features.csv`. Must: 24, should: 14, could: 8, skip: 5.

## Out of scope (cannot or should not be cloned)

- **TRIOS and Dental System native integration.** That is 3Shape's own closed link.
  Instead: accept STL/PLY/OBJ uploads and email or folder drop-ins, and use any
  official public partner API if one is offered later.
- **The Unite lab directory and its 1,000+ labs.** That is their network. Our version
  is a portal each lab invites its own doctors to.
- **3Shape CAD design itself** (Dental System). We manage the case, we don't design crowns.
- **WePay specifically.** Use Stripe, or a local gateway such as Moyasar or Tap if you sell in the Gulf.
- **Their brand, wording and screens.** Everything is rewritten (this is /replica-brand's job).

Regulated, not skipped: patient data is health data (HIPAA in the US, PDPL in Saudi
Arabia). Keep patient fields minimal and plan for encryption, audit logs and a data
processing agreement. If you sell in Saudi Arabia, invoices must follow ZATCA
e-invoicing (Fatoora).

## Size

Screens 24, flows 10, entities 18. Hard parts:
1. A production engine: routes, steps, barcode check-in/out, rework loops, on-time math.
2. Billing that works: price books, invoice on ship, statements, part payments, credits, card payments.
3. Large scan files and a doctor portal on a multi-tenant system holding patient data.

Size: **L** (about a quarter for a solid v1). A thin slice (S04, S05, S08, S09, S13)
can be running in a few weeks.

## Next: the walkthrough (fills in the gaps)

1. **Check the terms first.** You are building a competing product. 3Shape's LMS terms
   may forbid using your account for that. I couldn't open them (the site is blocked
   here). Read them, or send me the clause. If they forbid it, we stay on public sources only.
2. If the terms allow it: you click through your account and send screenshots of each
   screen above, in every state you can reach. They go in `replica/screens/S01.png`...
   I'll use them to fix screens, fields and click counts. Don't send screenshots with
   real patient names in them.
3. Allow `3shape.com`, `community.3shape.com` and `g2.com` in the environment's network
   settings, so I can read the help articles themselves rather than search summaries.
