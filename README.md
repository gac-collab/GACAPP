# GAC Fleet Checklists

Pages: index.html (site team), admin.html (admin, PIN set inside the file), debug.html (diagnostics).

## Firestore rules (REQUIRED)
Collections used: checklists, fleet, fleetStatus, serviceAlerts, serviceDefaults. Publish in Firebase console -> Firestore -> Rules:

    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /{col}/{doc} {
          allow read, write: if col in ['checklists','fleet','fleetStatus','serviceAlerts','serviceDefaults'];
        }
      }
    }

No-login trial setup: anyone with the link can read/write these collections. Add Firebase Auth before wide rollout.

## Fleet master
Admin -> Fleet Master -> import FLEET_MASTER_DATA.json (re-import to update). If autofill fails on a phone, open debug.html on the same site.

## Checklist library
templates.js: 16 equipment types, 61 checklists (all FM/PE forms from the original PDFs). Adding a type or interval = edit templates.js only.
Not yet included: GAC Tire QA checklist (Word file).
